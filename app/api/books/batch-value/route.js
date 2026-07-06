import { supabase } from '@/lib/supabase'
import { addValueRecord } from '@/lib/books'
import { lookupBookPrice } from '@/lib/pricing'

export async function POST(request) {
  const { book_ids } = await request.json()

  if (!book_ids?.length) {
    return Response.json({ error: 'No book IDs provided' }, { status: 400 })
  }

  const { data: books } = await supabase
    .from('books')
    .select('id, isbn_13, isbn_10, title, subtitle, language, country_of_origin, publication_year, format, condition, page_count, printing_number, authors:book_authors(authors(full_name)), publishers(name)')
    .in('id', book_ids)

  if (!books) return Response.json({ error: 'No books found' }, { status: 404 })

  const results = []

  for (const book of books) {
    const isbn = book.isbn_13 || book.isbn_10
    const result = await lookupBookPrice(isbn, book.title, {
      language: book.language,
      country: book.country_of_origin,
      year: book.publication_year,
      format: book.format,
      condition: book.condition,
      pages: book.page_count,
      printing: book.printing_number,
      subtitle: book.subtitle,
      author: book.authors?.[0]?.authors?.full_name,
      publisher: book.publishers?.name,
    })

    if (result) {
      await addValueRecord(book.id, result.value, result.source)
      results.push({
        id: book.id,
        title: book.title,
        value: result.value,
        source: result.source,
        sourceCount: result.sourceCount,
        status: 'updated',
      })
    } else {
      results.push({ id: book.id, title: book.title, value: null, source: null, status: 'not_found' })
    }

    // Rate limit between books
    await new Promise(r => setTimeout(r, 500))
  }

  return Response.json({ results })
}
