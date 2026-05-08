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
        .tag-header {
          margin-top: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #d4cfc8;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
        }

        .tag-type {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          font-weight: 400;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #9c8e7e;
          margin-bottom: 0.3rem;
        }

        .tag-count {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3rem;
          font-weight: 400;
          font-style: italic;
          color: #e8694a;
          line-height: 1;
        }

        .back-link {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          font-weight: 300;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #9c8e7e;
          text-decoration: none;
          display: inline-block;
          margin-top: 2rem;
        }
        .back-link:hover { color: #1a1814; }

        .book-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }

        .book-card {
          text-decoration: none;
          color: inherit;
          padding: 1.25rem;
          border: 1px solid #e8e4de;
          transition: all 0.15s ease;
        }

        .book-card:hover {
          border-color: #e8694a;
        }

        .book-card-cover {
          width: 100%;
          height: 160px;
          object-fit: cover;
          border-radius: 1px;
          margin-bottom: 1rem;
        }

        .book-card-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.05rem;
          font-weight: 600;
          color: #1a1814;
          line-height: 1.3;
        }

        .book-card-subtitle {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.85rem;
          font-style: italic;
          color: #9c8e7e;
          margin-top: 0.15rem;
        }

        .book-card-author {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          font-weight: 300;
          color: #6b6058;
          margin-top: 0.5rem;
        }

        .empty-tag {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          font-style: italic;
          color: #9c8e7e;
          margin-top: 2rem;
        }
      `}</style>

      <Link href="/genre" className="back-link">← Genre</Link>

      <div className="tag-header">
        <div>
          <p className="tag-type">{tag.type}</p>
          <h1 className="page-title">{tag.name}</h1>
        </div>
        <span className="tag-count">{books?.length ?? 0}</span>
      </div>

      {books?.length > 0 ? (
        <div className="book-grid">
          {books.map(book => (
            <Link key={book.id} href={`/books/${book.id}`} className="book-card">
              {book.cover_image_url && (
                <img src={book.cover_image_url} alt={book.title} className="book-card-cover" />
              )}
              <div className="book-card-title">{book.title}</div>
              {book.subtitle && <div className="book-card-subtitle">{book.subtitle}</div>}
              <div className="book-card-author">
                {book.authors?.[0]?.authors?.full_name ?? '—'}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="empty-tag">No books tagged with "{tag.name}" yet.</p>
      )}
    </PageShell>
  )
}
