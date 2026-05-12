import { supabase } from '@/lib/supabase'
import BookList from '@/app/components/BookList'
import PageShell from '@/app/components/PageShell'

export const dynamic = 'force-dynamic'

export default async function CollectionPage() {
  const { data: books, error } = await supabase
    .from('books')
    .select(`
      id,
      title,
      subtitle,
      publication_year,
      estimated_value_usd,
      language,
      condition,
      format,
      isbn_13,
      isbn_10,
      cover_image_url,
      authors:book_authors(
        authors(full_name)
      )
    `)
    .order('title')

  if (error) return <p style={{ padding: '2rem', color: 'red' }}>Error: {error.message}</p>

  return (
    <PageShell active="/collection">
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Collection</div>
          <h1 className="page-title" style={{ fontStyle: 'italic' }}>Books</h1>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: '0.65rem',
            color: 'var(--muted)',
            letterSpacing: '0.1em',
            marginTop: '0.8rem'
          }}>
            {books.length} volumes · sorted by title
          </div>
        </div>
      </div>

      <BookList books={books} />
    </PageShell>
  )
}
