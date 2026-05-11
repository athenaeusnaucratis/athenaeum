import { getAllAuthors } from '@/lib/books'
import { supabase } from '@/lib/supabase'
import PageShell from '@/app/components/PageShell'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AuthorsPage() {
  const { data: authors, error } = await getAllAuthors()

  if (error) return <p style={{ padding: '2rem', color: 'red' }}>Error: {error.message}</p>

  // Get book counts per author
  const { data: counts } = await supabase
    .from('book_authors')
    .select('author_id')

  const countMap = {}
  for (const c of counts ?? []) {
    countMap[c.author_id] = (countMap[c.author_id] ?? 0) + 1
  }

  return (
    <PageShell active="/authors">
      <style>{`
        .authors-header {
          margin-top: 2.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
        }

        .header-count {
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          font-weight: 300;
          color: #999;
        }

        .author-list { margin-top: 0; }

        .author-item {
          text-decoration: none; color: inherit;
          display: flex; align-items: baseline;
          justify-content: space-between;
          padding: 0.6rem 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .author-item:hover { background: #fafafa; }

        .author-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem; font-weight: 500; color: #2c2c2c;
        }

        .author-count {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem; font-weight: 300;
          color: #999; flex-shrink: 0;
        }

        .empty-state {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem; font-style: italic;
          color: #999; margin-top: 3rem;
        }
      `}</style>

      <div className="authors-header">
        <div>
          <h1 className="page-title">Authors</h1>
        </div>
        <span className="header-count">{authors?.length ?? 0} authors</span>
      </div>

      {authors?.length > 0 ? (
        <div className="author-list">
          {authors.map(a => (
            <Link key={a.id} href={`/authors/${a.id}`} className="author-item">
              <span className="author-name">{a.full_name}</span>
              <span className="author-count">{countMap[a.id] ?? 0}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="empty-state">No authors yet. Add books to see their authors here.</p>
      )}
    </PageShell>
  )
}
