import { addValueRecord, getValueHistory } from '@/lib/books'
import { supabase } from '@/lib/supabase'
import { searchEbaySoldPrice } from '@/lib/ebay'

export async function GET(request, { params }) {
  const { id } = await params
  const { data, error } = await getValueHistory(id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

async function lookupPrice(isbn, title) {
  // 1. Try eBay (primary — real market prices)
  const ebayResult = await searchEbaySoldPrice(isbn, title)
  if (ebayResult) return ebayResult

  // 2. Try Google Books
  if (isbn) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`,
        { cache: 'no-store' }
      )
      const json = await res.json()
      const saleInfo = json.items?.[0]?.saleInfo
      if (saleInfo?.listPrice?.amount) {
        return { value: saleInfo.listPrice.amount, source: 'google_books' }
      }
      if (saleInfo?.retailPrice?.amount) {
        return { value: saleInfo.retailPrice.amount, source: 'google_books' }
      }
    } catch {}
  }

  // 3. Try Google Books by title
  if (title) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=3`,
        { cache: 'no-store' }
      )
      const json = await res.json()
      for (const item of json.items ?? []) {
        const si = item.saleInfo
        if (si?.listPrice?.amount) {
          return { value: si.listPrice.amount, source: 'google_books_title' }
        }
        if (si?.retailPrice?.amount) {
          return { value: si.retailPrice.amount, source: 'google_books_title' }
        }
      }
    } catch {}
  }

  return null
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
    const result = await lookupPrice(isbn, book.title)

    if (result) {
      const { error } = await addValueRecord(id, result.value, result.source)
      if (error) return Response.json({ error: error.message }, { status: 500 })
      return Response.json({
        value: result.value,
        source: result.source,
        listings: result.listings,
        low: result.low,
        high: result.high,
      })
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
