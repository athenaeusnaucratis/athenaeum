import { supabase } from '@/lib/supabase'
import { addValueRecord } from '@/lib/books'

export async function POST(request) {
  const { book_ids } = await request.json()

  if (!book_ids?.length) {
    return Response.json({ error: 'No book IDs provided' }, { status: 400 })
  }

  const { data: books } = await supabase
    .from('books')
    .select('id, isbn_13, isbn_10, title')
    .in('id', book_ids)

  if (!books) return Response.json({ error: 'No books found' }, { status: 404 })

  const results = []

  for (const book of books) {
    const isbn = book.isbn_13 || book.isbn_10
    let value = null
    let source = null

    if (isbn) {
      try {
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`)
        const json = await res.json()
        const saleInfo = json.items?.[0]?.saleInfo
        if (saleInfo?.listPrice?.amount) {
          value = saleInfo.listPrice.amount
          source = 'google_books'
        } else if (saleInfo?.retailPrice?.amount) {
          value = saleInfo.retailPrice.amount
          source = 'google_books'
        }
      } catch {}
    }

    if (value) {
      await addValueRecord(book.id, value, source)
      results.push({ id: book.id, title: book.title, value, source, status: 'updated' })
    } else {
      results.push({ id: book.id, title: book.title, value: null, source: null, status: 'not_found' })
    }

    // Rate limit - 100ms between requests
    await new Promise(r => setTimeout(r, 100))
  }

  return Response.json({ results })
}
