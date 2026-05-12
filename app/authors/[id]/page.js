import { getAuthorById, getBooksByAuthor } from '@/lib/books'
import PageShell from '@/app/components/PageShell'
import MetadataRefresh from '@/app/components/MetadataRefresh'
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

        /* ── AUTHOR HEADER ── */
        .author-detail-header {
          display: flex;
          gap: 3rem;
          align-items: flex-start;
          padding: 3.5rem 5rem 3rem;
          border-bottom: 1px solid var(--rule);
          animation: fadeUp 0.6s 0.1s ease both;
        }

        .author-photo {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          border: 2px solid var(--rule);
        }

        .author-photo-placeholder {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          flex-shrink: 0;
          background: var(--warm-mid);
          border: 2px solid var(--rule);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--serif);
          font-size: 2.5rem;
          font-style: italic;
          color: var(--muted);
        }

        .author-info { flex: 1; }

        .author-eyebrow {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--coral);
          margin-bottom: 0.8rem;
        }

        .author-name-title {
          font-family: var(--serif);
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 300;
          line-height: 1.1;
          color: var(--ink);
          margin-bottom: 0.5rem;
        }

        .author-meta-line {
          font-family: var(--mono);
          font-size: 0.65rem;
          color: var(--muted);
          letter-spacing: 0.08em;
          margin-top: 0.6rem;
        }

        /* ── BIO ── */
        .author-bio-section {
          padding: 2.5rem 5rem;
          border-bottom: 1px solid var(--rule);
          animation: fadeUp 0.6s 0.2s ease both;
        }

        .bio-text {
          font-family: var(--serif);
          font-size: 1rem;
          font-weight: 300;
          font-style: italic;
          color: var(--muted);
          line-height: 1.8;
          max-width: 65ch;
        }

        /* ── BOOKS TABLE ── */
        .author-books-section {
          animation: fadeUp 0.6s 0.25s ease both;
        }

        .author-books-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          padding: 2rem 5rem 1.5rem;
          border-bottom: 1px solid var(--rule);
        }

        .author-books-title {
          font-family: var(--serif);
          font-size: 1.2rem;
          font-style: italic;
          font-weight: 300;
          color: var(--ink);
        }

        .author-books-count {
          font-family: var(--mono);
          font-size: 0.62rem;
          color: var(--muted);
          letter-spacing: 0.1em;
        }

        .author-book-row {
          display: grid;
          grid-template-columns: 1fr auto auto;
          align-items: center;
          padding: 1.2rem 5rem;
          border-bottom: 1px solid var(--rule);
          text-decoration: none;
          color: inherit;
          transition: background 0.15s;
        }
        .author-book-row:hover { background: var(--warm-mid); }

        .ab-title {
          font-family: var(--serif);
          font-size: 1.05rem;
          font-weight: 400;
          color: var(--ink);
          transition: color 0.15s;
        }
        .author-book-row:hover .ab-title { color: var(--coral); }

        .ab-subtitle {
          font-family: var(--serif);
          font-size: 0.82rem;
          font-style: italic;
          color: var(--muted);
          margin-top: 0.15rem;
        }

        .ab-year {
          font-family: var(--mono);
          font-size: 0.68rem;
          color: var(--muted);
          letter-spacing: 0.06em;
          padding: 0 2rem;
        }

        .ab-value {
          font-family: var(--mono);
          font-size: 0.7rem;
          color: var(--coral);
          letter-spacing: 0.06em;
        }
        .ab-value.none { color: var(--muted); }

        .ab-arrow {
          font-family: var(--serif);
          font-size: 1rem;
          color: var(--rule);
          padding-left: 2rem;
          transition: color 0.15s, transform 0.15s;
        }
        .author-book-row:hover .ab-arrow { color: var(--coral); transform: translateX(4px); }

        /* ── ACTIONS ── */
        .author-actions {
          padding: 2.5rem 5rem 4rem;
          animation: fadeUp 0.6s 0.3s ease both;
        }

        .meta-refresh { margin-top: 0; }
        .mr-label {
          font-family: var(--mono); font-size: 0.6rem; font-weight: 400;
          letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted);
          margin-bottom: 0.75rem;
        }
        .mr-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .mr-msg { font-family: var(--mono); font-size: 0.65rem; color: var(--muted); }
        .mr-err { color: var(--coral); }
        .vp-btn {
          font-family: var(--mono); font-size: 0.6rem; font-weight: 300;
          letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted);
          background: transparent; border: 1px solid var(--rule); padding: 0.3rem 0.7rem;
          cursor: pointer; transition: all 0.15s ease;
        }
        .vp-btn:hover { border-color: var(--ink); color: var(--ink); }
        .vp-btn:disabled { opacity: 0.3; cursor: default; }

        .empty-state {
          font-family: var(--serif);
          font-size: 1rem;
          font-style: italic;
          color: var(--muted);
          padding: 3rem 5rem;
        }

        @media (max-width: 768px) {
          .author-detail-header { padding: 2rem 1.25rem; gap: 1.5rem; }
          .author-photo, .author-photo-placeholder { width: 80px; height: 80px; }
          .author-bio-section { padding: 2rem 1.25rem; }
          .author-books-header { padding: 1.5rem 1.25rem; }
          .author-book-row { padding: 1rem 1.25rem; grid-template-columns: 1fr auto; }
          .ab-year { display: none; }
          .author-actions { padding: 2rem 1.25rem 3rem; }
          .breadcrumb { padding: 1rem 1.25rem; }
        }
      `}</style>

      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <Link href="/authors">Authors</Link>
        <span className="sep">/</span>
        <span className="current">{author.full_name}</span>
      </div>

      {/* AUTHOR HEADER */}
      <div className="author-detail-header">
        {author.photo_url ? (
          <img src={author.photo_url} alt={author.full_name} className="author-photo" />
        ) : (
          <div className="author-photo-placeholder">
            {(author.full_name || '?')[0]}
          </div>
        )}
        <div className="author-info">
          <div className="author-eyebrow">Author</div>
          <h1 className="author-name-title">{author.full_name}</h1>
          {(author.nationality || author.birth_year) && (
            <div className="author-meta-line">
              {[author.nationality, author.birth_year ? `b. ${author.birth_year}` : null].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
      </div>

      {/* BIO */}
      {author.bio && (
        <div className="author-bio-section">
          <p className="bio-text">{author.bio}</p>
        </div>
      )}

      {/* BOOKS */}
      {books?.length > 0 ? (
        <div className="author-books-section">
          <div className="author-books-header">
            <span className="author-books-title">Books in collection</span>
            <span className="author-books-count">{books.length} book{books.length !== 1 ? 's' : ''}</span>
          </div>
          {books.map(book => (
            <Link key={book.id} href={`/books/${book.id}`} className="author-book-row">
              <div>
                <div className="ab-title">{book.title}</div>
                {book.subtitle && <div className="ab-subtitle">{book.subtitle}</div>}
              </div>
              <span className="ab-year">{book.publication_year ?? ''}</span>
              <span className={`ab-value${book.estimated_value_usd ? '' : ' none'}`}>
                {book.estimated_value_usd ? `$${Number(book.estimated_value_usd).toFixed(2)}` : '—'}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="empty-state">No books by this author yet.</p>
      )}

      {/* METADATA REFRESH */}
      <div className="author-actions">
        <MetadataRefresh authorId={id} />
      </div>
    </PageShell>
  )
}
