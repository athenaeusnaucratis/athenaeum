import { addValueRecord, getValueHistory } from '@/lib/books'
import { supabase } from '@/lib/supabase'

export async function GET(request, { params }) {
  const { id } = await params
  const { data, error } = await getValueHistory(id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request, { params }) {
  const { id } = await params
  const { action } = await request.json()

  if (action === 'lookup') {
    // Get book's ISBN for lookup
    const { data: book } = await supabase
      .from('books')
      .select('isbn_13, isbn_10, title')
      .eq('id', id)
      .single()

    if (!book) return Response.json({ error: 'Book not found' }, { status: 404 })

    const isbn = book.isbn_13 || book.isbn_10
    let estimatedValue = null
    let source = 'manual'

    if (isbn) {
      // Try Google Books for list price
      try {
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`)
        const json = await res.json()
        const saleInfo = json.items?.[0]?.saleInfo
        if (saleInfo?.listPrice?.amount) {
          estimatedValue = saleInfo.listPrice.amount
          source = 'google_books'
        } else if (saleInfo?.retailPrice?.amount) {
          estimatedValue = saleInfo.retailPrice.amount
          source = 'google_books'
        }
      } catch {}
    }

    if (!isbn && !estimatedValue) {
      // Try Google Books by title
      try {
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(book.title)}&maxResults=1`)
        const json = await res.json()
        const saleInfo = json.items?.[0]?.saleInfo
        if (saleInfo?.listPrice?.amount) {
          estimatedValue = saleInfo.listPrice.amount
          source = 'google_books_title'
        }
      } catch {}
    }

    if (estimatedValue) {
      const { error } = await addValueRecord(id, estimatedValue, source)
      if (error) return Response.json({ error: error.message }, { status: 500 })
      return Response.json({ value: estimatedValue, source })
    }

    return Response.json({ error: 'No price data found', value: null, source: null }, { status: 200 })
  }

  // Manual value entry
  const { value, source } = await request.json()
  if (!value) return Response.json({ error: 'Value required' }, { status: 400 })
  const { error } = await addValueRecord(id, parseFloat(value), source || 'manual')
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
