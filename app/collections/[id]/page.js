import { getCollectionById, getBooksByCollection } from '@/lib/books'
import PageShell from '@/app/components/PageShell'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function CollectionDetailPage({ params }) {
  const { id } = await params
  const { data: collection } = await getCollectionById(id)

  if (!collection) return notFound()

  const { data: books } = await getBooksByCollection(id)

  return (
    <PageShell active="/collections">
      <style>{`
        .back-link {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem; font-weight: 300;
          color: #999; text-decoration: none;
          display: inline-block; margin-top: 2.5rem;
        }
        .back-link:hover { color: #2c2c2c; }

        .col-header {
          margin-top: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
        }

        .col-desc {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.95rem; font-style: italic; color: #999;
          margin-top: 0.25rem;
        }

        .col-count {
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

        .empty-col {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem; font-style: italic;
          color: #999; margin-top: 2rem;
        }
      `}</style>

      <Link href="/collections" className="back-link">← Shelves</Link>

      <div className="col-header">
        <div>
          <h1 className="page-title">{collection.name}</h1>
          {collection.description && <p className="col-desc">{collection.description}</p>}
        </div>
        <span className="col-count">{books?.length ?? 0} books</span>
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
        <p className="empty-col">No books in this collection yet.</p>
      )}
    </PageShell>
  )
}
