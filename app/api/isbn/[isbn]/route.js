export async function GET(request, { params }) {
  const { isbn } = await params
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`,
    { next: { revalidate: 86400 } }
  )
  const json = await res.json()
  const item = json.items?.[0]?.volumeInfo

  if (!item) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

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
  })
}
