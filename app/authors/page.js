import { supabase } from '@/lib/supabase'
import PageShell from '@/app/components/PageShell'
import AuthorList from '@/app/components/AuthorList'

export const dynamic = 'force-dynamic'

export default async function AuthorsPage() {
  // Get all authors with their book counts and a notable book title
  const { data: authors, error } = await supabase
    .from('authors')
    .select('id, full_name, sort_name')
    .order('sort_name')

  if (error) return <p style={{ padding: '2rem', color: 'red' }}>Error: {error.message}</p>

  // Get book counts and notable titles per author
  const { data: bookAuthors } = await supabase
    .from('book_authors')
    .select('author_id, books(title, publication_year)')

  const authorInfo = {}
  for (const ba of bookAuthors ?? []) {
    if (!authorInfo[ba.author_id]) authorInfo[ba.author_id] = { count: 0, books: [] }
    authorInfo[ba.author_id].count++
    if (ba.books) authorInfo[ba.author_id].books.push(ba.books)
  }

  // Build enriched author list
  const enriched = (authors || []).map(a => {
    const info = authorInfo[a.id] || { count: 0, books: [] }
    const notable = info.books.sort((x, y) => (y.publication_year || 0) - (x.publication_year || 0))[0]
    return {
      ...a,
      bookCount: info.count,
      notableTitle: notable?.title || '',
      notableYear: notable?.publication_year || null,
    }
  })

  const totalBooks = enriched.reduce((s, a) => s + a.bookCount, 0)

  return (
    <PageShell active="/authors">
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Browse by</div>
          <h1 className="page-title" style={{ fontStyle: 'italic' }}>Authors</h1>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: '0.65rem',
            color: 'var(--muted)',
            letterSpacing: '0.1em',
            marginTop: '0.8rem'
          }}>
            {enriched.length} authors · {totalBooks} books
          </div>
        </div>
      </div>

      <AuthorList authors={enriched} />
    </PageShell>
  )
}
