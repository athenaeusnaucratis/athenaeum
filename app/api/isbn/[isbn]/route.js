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
        publication_year: item.publishedDate ? parseInt(item.publishedDate) : null,
        page_count: item.pageCount ?? null,
        language: item.language ?? null,
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
        publication_year: ol.publish_date ? parseInt(ol.publish_date) : null,
        page_count: ol.number_of_pages ?? null,
        language: null,
        cover_image_url: coverUrl,
        isbn_13: ol.isbn_13?.[0] ?? (clean.length === 13 ? clean : null),
        isbn_10: ol.isbn_10?.[0] ?? (clean.length === 10 ? clean : null),
        source: 'open_library',
      })
    }
  } catch {}

  return Response.json({ error: 'Not found', scanned: clean }, { status: 404 })
}
