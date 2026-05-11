import { getBooksByTag } from '@/lib/books'
import { supabase } from '@/lib/supabase'
import PageShell from '@/app/components/PageShell'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function TagDetailPage({ params }) {
  const { id } = await params

  const { data: tag } = await supabase
    .from('tags')
    .select('id, name, type')
    .eq('id', id)
    .single()

  if (!tag) return notFound()

  const { data: books } = await getBooksByTag(id)

  return (
    <PageShell active="/genre">
      <style>{`
        .back-link {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem; font-weight: 300;
          color: #999; text-decoration: none;
          display: inline-block; margin-top: 2.5rem;
        }
        .back-link:hover { color: #2c2c2c; }

        .tag-header {
          margin-top: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
        }

        .tag-type {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem; font-weight: 400;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: #999; margin-bottom: 0.3rem;
        }

        .tag-count {
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem; font-weight: 300;
          color: #999;
        }

        .book-list { margin-top: 0; }

        .book-item {
          text-decoration: none; color: inherit;
          display: flex; align-items: baseline;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .book-item:hover { background: #fafafa; }

        .book-item-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem; font-weight: 500; color: #2c2c2c;
        }

        .book-item-author {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem; font-weight: 300;
          color: #999; flex-shrink: 0; margin-left: 1rem;
        }

        .empty-tag {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem; font-style: italic;
          color: #999; margin-top: 2rem;
        }
      `}</style>

      <Link href="/genre" className="back-link">← Genre</Link>

      <div className="tag-header">
        <div>
          <p className="tag-type">{tag.type}</p>
          <h1 className="page-title">{tag.name}</h1>
        </div>
        <span className="tag-count">{books?.length ?? 0} books</span>
      </div>

      {books?.length > 0 ? (
        <div className="book-list">
          {books.map(book => (
            <Link key={book.id} href={`/books/${book.id}`} className="book-item">
              <span className="book-item-title">{book.title}</span>
              <span className="book-item-author">
                {book.authors?.[0]?.authors?.full_name ?? '—'}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="empty-tag">No books tagged with "{tag.name}" yet.</p>
      )}
    </PageShell>
  )
}
