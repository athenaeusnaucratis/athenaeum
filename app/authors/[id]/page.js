import { getAuthorById, getBooksByAuthor } from '@/lib/books'
import PageShell from '@/app/components/PageShell'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AuthorDetailPage({ params }) {
  const { id } = await params
  const { data: author } = await getAuthorById(id)

  if (!author) return notFound()

  const { data: books } = await getBooksByAuthor(id)

  return (
    <PageShell active="/authors">
      <style>{`
        .back-link {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem; font-weight: 300;
          color: #999; text-decoration: none;
          display: inline-block; margin-top: 2.5rem;
        }
        .back-link:hover { color: #2c2c2c; }

        .author-header {
          margin-top: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
        }

        .author-meta {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem; font-weight: 300;
          color: #999; margin-top: 0.3rem;
        }

        .book-count {
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

        .book-item-year {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem; font-weight: 300;
          color: #999; flex-shrink: 0; margin-left: 1rem;
        }

        .empty-state {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem; font-style: italic;
          color: #999; margin-top: 2rem;
        }
      `}</style>

      <Link href="/authors" className="back-link">← Authors</Link>

      <div className="author-header">
        <div>
          <h1 className="page-title">{author.full_name}</h1>
          {author.nationality && <p className="author-meta">{author.nationality}</p>}
        </div>
        <span className="book-count">{books?.length ?? 0} books</span>
      </div>

      {books?.length > 0 ? (
        <div className="book-list">
          {books.map(book => (
            <Link key={book.id} href={`/books/${book.id}`} className="book-item">
              <span className="book-item-title">{book.title}</span>
              <span className="book-item-year">{book.publication_year ?? ''}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="empty-state">No books by this author yet.</p>
      )}
    </PageShell>
  )
}
