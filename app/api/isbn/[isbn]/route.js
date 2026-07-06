import { normalizeLanguage, parseYear } from '@/lib/books'

// Normalize physical format (from Open Library) to match our dropdown values
function normalizeFormat(raw) {
  if (!raw) return null
  const s = String(raw).toLowerCase()
  if (/hard.?cover|hardback|hardbound|cloth/.test(s)) return 'Hardcover'
  if (/paperback|softcover|soft.?cover/.test(s)) return 'Paperback'
  if (/spiral/.test(s)) return 'Spiral-bound'
  if (/board.?book/.test(s)) return 'Board Book'
  if (/ring.?bound/.test(s)) return 'Ring-bound'
  if (/leather/.test(s)) return 'Leather-bound'
  if (/loose.?leaf/.test(s)) return 'Loose Leaf'
  if (/mass.?market/.test(s)) return 'Mass Market'
  if (/trade.?paperback/.test(s)) return 'Trade Paperback'
  return null
}

export async function GET(request, { params }) {
  const { isbn } = await params
  const clean = isbn.replace(/[^0-9Xx]/g, '')

  // Try Google Books first
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${clean}&maxResults=1`,
      { cache: 'no-store' }
    )
    const json = await res.json()
    const item = json.items?.[0]?.volumeInfo

    if (item) {
      const isbn13 = item.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier ?? null
      const isbn10 = item.industryIdentifiers?.find(i => i.type === 'ISBN_10')?.identifier ?? null

      return Response.json({
        title: item.title ?? '',
        subtitle: item.subtitle ?? '',
        author: item.authors?.[0] ?? '',
        publisher: item.publisher ?? '',
        publication_year: parseYear(item.publishedDate),
        page_count: item.pageCount ?? null,
        language: normalizeLanguage(item.language),
        cover_image_url: item.imageLinks?.thumbnail?.replace('http:', 'https:') ?? null,
        isbn_13: isbn13,
        isbn_10: isbn10,
        source: 'google_books',
      })
    }
  } catch {}

  // Fallback: Open Library
  try {
    const olRes = await fetch(
      `https://openlibrary.org/isbn/${clean}.json`,
      { cache: 'no-store' }
    )
    if (olRes.ok) {
      const ol = await olRes.json()

      // Get author name if available
      let author = ''
      if (ol.authors?.[0]?.key) {
        try {
          const authorRes = await fetch(`https://openlibrary.org${ol.authors[0].key}.json`)
          const authorData = await authorRes.json()
          author = authorData.name ?? ''
        } catch {}
      }

      // Get cover URL
      const coverId = ol.covers?.[0]
      const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null

      return Response.json({
        title: ol.title ?? '',
        subtitle: ol.subtitle ?? '',
        author,
        publisher: ol.publishers?.[0] ?? '',
        publication_year: parseYear(ol.publish_date),
        page_count: ol.number_of_pages ?? null,
        language: null,
        format: normalizeFormat(ol.physical_format),
        cover_image_url: coverUrl,
        isbn_13: ol.isbn_13?.[0] ?? (clean.length === 13 ? clean : null),
        isbn_10: ol.isbn_10?.[0] ?? (clean.length === 10 ? clean : null),
        source: 'open_library',
      })
    }
  } catch {}

  return Response.json({ error: 'Not found', scanned: clean }, { status: 404 })
}
