import { getCollectionById, getBooksByCollection } from '@/lib/books'
import PageShell from '@/app/components/PageShell'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function CollectionDetailPage({ params }) {
  const { id } = await params
  const { data: collection } = await getCollectionById(id)

  if (!collection) return notFound()

  const { data: books } = await getBooksByCollection(id)

  const totalValue = (books || []).reduce((s, b) => s + (Number(b.estimated_value_usd) || 0), 0)
  const years = (books || []).map(b => b.publication_year).filter(Boolean)
  const minYear = years.length ? Math.min(...years) : null
  const maxYear = years.length ? Math.max(...years) : null

  return (
    <PageShell active="/collections">
      <style>{`
        /* ── BREADCRUMB ── */
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 1.4rem 5rem;
          border-bottom: 1px solid var(--rule);
          animation: fadeUp 0.5s 0.05s ease both;
        }
        .breadcrumb a, .breadcrumb span {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
        }
        .breadcrumb a { color: var(--muted); transition: color 0.15s; }
        .breadcrumb a:hover { color: var(--ink); }
        .breadcrumb .sep { color: var(--rule); }
        .breadcrumb span.current { color: var(--coral); }

        /* ── COLLECTION HEADER ── */
        .coll-detail-header {
          padding: 3.5rem 5rem 3rem;
          border-bottom: 1px solid var(--rule);
          animation: fadeUp 0.6s 0.1s ease both;
        }

        .coll-eyebrow {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--coral);
          margin-bottom: 0.8rem;
        }

        .coll-name-title {
          font-family: var(--serif);
          font-size: clamp(2rem, 4vw, 3.5rem);
          font-weight: 300;
          font-style: italic;
          line-height: 1.1;
          color: var(--ink);
        }

        .coll-desc {
          font-family: var(--sans);
          font-size: 0.82rem;
          font-weight: 300;
          color: var(--muted);
          line-height: 1.8;
          letter-spacing: 0.02em;
          max-width: 55ch;
          margin-top: 1rem;
        }

        .coll-stats {
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-top: 1.5rem;
        }

        .coll-stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .coll-stat-val {
          font-family: var(--serif);
          font-size: 1.6rem;
          font-weight: 300;
          color: var(--ink);
          line-height: 1;
        }

        .coll-stat-label {
          font-family: var(--mono);
          font-size: 0.58rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .coll-stat-divider {
          width: 1px;
          height: 36px;
          background: var(--rule);
        }

        /* ── BOOK ROWS ── */
        .coll-books-section {
          animation: fadeUp 0.6s 0.2s ease both;
        }

        .coll-books-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          padding: 2rem 5rem 1.5rem;
          border-bottom: 1px solid var(--rule);
        }

        .coll-books-title {
          font-family: var(--serif);
          font-size: 1.2rem;
          font-style: italic;
          font-weight: 300;
          color: var(--ink);
        }

        .coll-books-count {
          font-family: var(--mono);
          font-size: 0.62rem;
          color: var(--muted);
          letter-spacing: 0.1em;
        }

        .coll-book-row {
          display: grid;
          grid-template-columns: auto 1fr auto auto;
          align-items: center;
          padding: 1.2rem 5rem;
          border-bottom: 1px solid var(--rule);
          text-decoration: none;
          color: inherit;
          transition: background 0.15s;
          gap: 1.5rem;
        }
        .coll-book-row:hover { background: var(--warm-mid); }

        .cb-num {
          font-family: var(--mono);
          font-size: 0.58rem;
          letter-spacing: 0.12em;
          color: var(--rule);
          min-width: 1.5rem;
        }

        .cb-info { min-width: 0; }

        .cb-title {
          font-family: var(--serif);
          font-size: 1.05rem;
          font-weight: 400;
          color: var(--ink);
          transition: color 0.15s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .coll-book-row:hover .cb-title { color: var(--coral); }

        .cb-author {
          font-family: var(--mono);
          font-size: 0.62rem;
          color: var(--muted);
          letter-spacing: 0.04em;
          margin-top: 0.15rem;
        }

        .cb-year {
          font-family: var(--mono);
          font-size: 0.68rem;
          color: var(--muted);
          letter-spacing: 0.06em;
          white-space: nowrap;
        }

        .cb-value {
          font-family: var(--mono);
          font-size: 0.7rem;
          color: var(--coral);
          letter-spacing: 0.06em;
          white-space: nowrap;
        }
        .cb-value.none { color: var(--muted); }

        .empty-state {
          font-family: var(--serif);
          font-size: 1rem;
          font-style: italic;
          color: var(--muted);
          padding: 3rem 5rem;
        }

        @media (max-width: 768px) {
          .breadcrumb { padding: 1rem 1.25rem; }
          .coll-detail-header { padding: 2rem 1.25rem; }
          .coll-stats { gap: 1.5rem; flex-wrap: wrap; }
          .coll-books-header { padding: 1.5rem 1.25rem; }
          .coll-book-row {
            padding: 1rem 1.25rem;
            grid-template-columns: auto 1fr auto;
          }
          .cb-year { display: none; }
        }
      `}</style>

      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <Link href="/collections">Collections</Link>
        <span className="sep">/</span>
        <span className="current">{collection.name}</span>
      </div>

      {/* HEADER */}
      <div className="coll-detail-header">
        <div className="coll-eyebrow">Collection</div>
        <h1 className="coll-name-title">{collection.name}</h1>
        {collection.description && <p className="coll-desc">{collection.description}</p>}
        <div className="coll-stats">
          <div className="coll-stat">
            <span className="coll-stat-val">{books?.length ?? 0}</span>
            <span className="coll-stat-label">volumes</span>
          </div>
          {totalValue > 0 && (
            <>
              <div className="coll-stat-divider"></div>
              <div className="coll-stat">
                <span className="coll-stat-val">${Math.round(totalValue)}</span>
                <span className="coll-stat-label">est. value</span>
              </div>
            </>
          )}
          {minYear && (
            <>
              <div className="coll-stat-divider"></div>
              <div className="coll-stat">
                <span className="coll-stat-val">{minYear === maxYear ? minYear : `${minYear}–${String(maxYear).slice(2)}`}</span>
                <span className="coll-stat-label">span</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* BOOKS */}
      {books?.length > 0 ? (
        <div className="coll-books-section">
          <div className="coll-books-header">
            <span className="coll-books-title">Books in collection</span>
            <span className="coll-books-count">{books.length} book{books.length !== 1 ? 's' : ''}</span>
          </div>
          {books.map((book, i) => (
            <Link key={book.id} href={`/books/${book.id}`} className="coll-book-row">
              <span className="cb-num">{String(i + 1).padStart(2, '0')}</span>
              <div className="cb-info">
                <div className="cb-title">{book.title}</div>
                <div className="cb-author">{book.authors?.[0]?.authors?.full_name ?? '—'}</div>
              </div>
              <span className="cb-year">{book.publication_year ?? ''}</span>
              <span className={`cb-value${book.estimated_value_usd ? '' : ' none'}`}>
                {book.estimated_value_usd ? `$${Number(book.estimated_value_usd).toFixed(2)}` : '—'}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="empty-state">No books in this collection yet.</p>
      )}
    </PageShell>
  )
}
