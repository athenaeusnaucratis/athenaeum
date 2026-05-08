import { getBookById } from '@/lib/books'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function BookPage({ params }) {
  const { id } = await params
  const { data: book, error } = await getBookById(id)

  if (error || !book) return notFound()

  const authors = book.authors?.map(a => a.authors?.full_name).filter(Boolean).join(', ') || '—'
  const publisher = book.publishers?.name || '—'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Mono:wght@300;400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body { background-color: #f7f4ef; color: #1a1814; }

        .page {
          min-height: 100vh;
          padding: 0 2.5rem 4rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header {
          padding: 3rem 0 2rem;
          border-bottom: 1px solid #d4cfc8;
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
          margin-bottom: 1.5rem;
        }

        .back-link:hover { color: #1a1814; }

        .book-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3rem;
          font-weight: 600;
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: #1a1814;
        }

        .book-subtitle {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.4rem;
          font-style: italic;
          color: #9c8e7e;
          margin-top: 0.4rem;
        }

        .book-author {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem;
          color: #4a443c;
          margin-top: 0.75rem;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }

        .detail-item label {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          font-weight: 400;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #9c8e7e;
          display: block;
          margin-bottom: 0.35rem;
        }

        .detail-item span {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          color: #1a1814;
        }

        .detail-item span.mono {
          font-family: 'DM Mono', monospace;
          font-size: 0.8rem;
          font-weight: 300;
        }

        .detail-item span.value {
          font-family: 'DM Mono', monospace;
          font-size: 0.8rem;
          color: #e8694a;
        }

        .book-header-layout {
          display: flex;
          gap: 2rem;
          margin-top: -0.5rem;
        }

        .book-cover {
          width: 140px;
          flex-shrink: 0;
          border-radius: 2px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
        }

        .notes-section {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid #d4cfc8;
        }

        .notes-section label {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          font-weight: 400;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #9c8e7e;
          display: block;
          margin-bottom: 0.75rem;
        }

        .notes-section p {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          line-height: 1.6;
          color: #4a443c;
        }
      `}</style>

      <div className="page">
        <header className="header">
          <Link href="/" className="back-link">← Athenaeum</Link>
          <div className="book-header-layout">
            {book.cover_image_url && (
              <img src={book.cover_image_url} alt={book.title} className="book-cover" />
            )}
            <div>
              <h1 className="book-title">{book.title}</h1>
              {book.subtitle && <p className="book-subtitle">{book.subtitle}</p>}
              <p className="book-author">{authors}</p>
            </div>
          </div>
        </header>

        <div className="detail-grid">
          <div className="detail-item">
            <label>Publisher</label>
            <span>{publisher}</span>
          </div>
          <div className="detail-item">
            <label>Year</label>
            <span className="mono">{book.publication_year ?? '—'}</span>
          </div>
          {book.edition && (
            <div className="detail-item">
              <label>Edition</label>
              <span className="mono">{book.edition}</span>
            </div>
          )}
          {book.printing_number && (
            <div className="detail-item">
              <label>Printing</label>
              <span className="mono">{book.printing_number}</span>
            </div>
          )}
          <div className="detail-item">
            <label>Format</label>
            <span>{book.format ?? '—'}</span>
          </div>
          <div className="detail-item">
            <label>Pages</label>
            <span className="mono">{book.page_count ?? '—'}</span>
          </div>
          <div className="detail-item">
            <label>Language</label>
            <span>{book.language ?? '—'}</span>
          </div>
          <div className="detail-item">
            <label>Country</label>
            <span>{book.country_of_origin ?? '—'}</span>
          </div>
          <div className="detail-item">
            <label>Condition</label>
            <span>{book.condition ?? '—'}</span>
          </div>
          {book.dimensions && (
            <div className="detail-item">
              <label>Dimensions</label>
              <span className="mono">{book.dimensions}</span>
            </div>
          )}
          {book.isbn_13 && (
            <div className="detail-item">
              <label>ISBN-13</label>
              <span className="mono">{book.isbn_13}</span>
            </div>
          )}
          {book.isbn_10 && (
            <div className="detail-item">
              <label>ISBN-10</label>
              <span className="mono">{book.isbn_10}</span>
            </div>
          )}
          <div className="detail-item">
            <label>Est. Value</label>
            {book.estimated_value_usd
              ? <span className="value">${Number(book.estimated_value_usd).toFixed(2)}</span>
              : <span className="mono" style={{ color: '#c8c2ba' }}>—</span>
            }
          </div>
        </div>

        {book.notes && (
          <div className="notes-section">
            <label>Notes</label>
            <p>{book.notes}</p>
          </div>
        )}
      </div>
    </>
  )
}
