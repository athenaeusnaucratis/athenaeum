import { supabase } from '@/lib/supabase'
import { addValueRecord } from '@/lib/books'
import { searchEbaySoldPrice } from '@/lib/ebay'

async function lookupPrice(isbn, title) {
  // Try eBay first
  const ebayResult = await searchEbaySoldPrice(isbn, book.title)
  if (ebayResult) return ebayResult

  // Try Google Books by ISBN
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

  // Try Google Books by title
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
    const result = await lookupPrice(isbn, book.title)

    if (result) {
      await addValueRecord(book.id, result.value, result.source)
      results.push({ id: book.id, title: book.title, value: result.value, source: result.source, status: 'updated' })
    } else {
      results.push({ id: book.id, title: book.title, value: null, source: null, status: 'not_found' })
    }

    // Rate limit - 300ms between requests for eBay
    await new Promise(r => setTimeout(r, 300))
  }

  return Response.json({ results })
}
