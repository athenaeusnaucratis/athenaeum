import { addValueRecord, getValueHistory } from '@/lib/books'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { lookupBookPrice } from '@/lib/pricing'

export async function GET(request, { params }) {
  const { id } = await params
  const { data, error } = await getValueHistory(id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request, { params }) {
  const { id } = await params
  const body = await request.json()

  if (body.action === 'lookup') {
    const { data: book } = await supabase
      .from('books')
      .select('isbn_13, isbn_10, title, subtitle, language, country_of_origin, publication_year, format, condition, page_count, printing_number, authors:book_authors(authors(full_name)), publishers(name)')
      .eq('id', id)
      .single()

    if (!book) return Response.json({ error: 'Book not found' }, { status: 404 })

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
      // Persist per-source snapshot so the book page shows the breakdown without re-fetching.
      // Delete stale sources for this book first, then upsert current ones.
      await supabaseAdmin.from('book_source_prices').delete().eq('book_id', id)
      if (Array.isArray(result.sources) && result.sources.length) {
        await supabaseAdmin.from('book_source_prices').insert(
          result.sources.map(s => ({
            book_id: id,
            source: s.name,
            value_usd: s.value,
            listings: s.listings ?? null,
            low_usd: s.low ?? null,
            high_usd: s.high ?? null,
            note: s.note ?? null,
          }))
        )
      }
      // Aggregate value (median across sources) still populates books.estimated_value_usd.
      const { error } = await addValueRecord(id, result.median ?? result.value, result.source)
      if (error) return Response.json({ error: error.message }, { status: 500 })
      return Response.json(result)
    }

    return Response.json({ error: 'No price data found', value: null, source: null }, { status: 200 })
  }

  // Manual value entry
  const { value, source } = body
  if (!value) return Response.json({ error: 'Value required' }, { status: 400 })
  const { error } = await addValueRecord(id, parseFloat(value), source || 'manual')
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
