import { addValueRecord, getValueHistory } from '@/lib/books'
import { supabase } from '@/lib/supabase'
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
      .select('isbn_13, isbn_10, title')
      .eq('id', id)
      .single()

    if (!book) return Response.json({ error: 'Book not found' }, { status: 404 })

    const isbn = book.isbn_13 || book.isbn_10
    const result = await lookupBookPrice(isbn, book.title)

    if (result) {
      const { error } = await addValueRecord(id, result.value, result.source)
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
