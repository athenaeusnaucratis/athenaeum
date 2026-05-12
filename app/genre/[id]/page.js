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

        /* ── TAG HEADER ── */
        .tag-detail-header {
          padding: 3.5rem 5rem 3rem;
          border-bottom: 1px solid var(--rule);
          animation: fadeUp 0.6s 0.1s ease both;
        }

        .tag-eyebrow {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--coral);
          margin-bottom: 0.8rem;
        }

        .tag-name-title {
          font-family: var(--serif);
          font-size: clamp(2rem, 4vw, 3.5rem);
          font-weight: 300;
          font-style: italic;
          line-height: 1.1;
          color: var(--ink);
        }

        .tag-book-count {
          font-family: var(--mono);
          font-size: 0.65rem;
          color: var(--muted);
          letter-spacing: 0.1em;
          margin-top: 0.8rem;
        }

        /* ── BOOK ROWS ── */
        .tag-book-row {
          display: grid;
          grid-template-columns: 1fr auto auto;
          align-items: center;
          padding: 1.2rem 5rem;
          border-bottom: 1px solid var(--rule);
          text-decoration: none;
          color: inherit;
          transition: background 0.15s;
          animation: fadeUp 0.5s 0.15s ease both;
        }
        .tag-book-row:hover { background: var(--warm-mid); }

        .tb-title {
          font-family: var(--serif);
          font-size: 1.05rem;
          font-weight: 400;
          color: var(--ink);
          transition: color 0.15s;
        }
        .tag-book-row:hover .tb-title { color: var(--coral); }

        .tb-author {
          font-family: var(--mono);
          font-size: 0.65rem;
          color: var(--muted);
          letter-spacing: 0.04em;
          padding: 0 2rem;
        }

        .tb-value {
          font-family: var(--mono);
          font-size: 0.7rem;
          color: var(--coral);
          letter-spacing: 0.06em;
        }
        .tb-value.none { color: var(--muted); }

        .empty-state {
          font-family: var(--serif);
          font-size: 1rem;
          font-style: italic;
          color: var(--muted);
          padding: 3rem 5rem;
        }

        @media (max-width: 768px) {
          .breadcrumb { padding: 1rem 1.25rem; }
          .tag-detail-header { padding: 2rem 1.25rem; }
          .tag-book-row { padding: 1rem 1.25rem; grid-template-columns: 1fr auto; }
          .tb-author { display: none; }
        }
      `}</style>

      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <Link href="/genre">Category</Link>
        <span className="sep">/</span>
        <span className="current">{tag.name}</span>
      </div>

      {/* HEADER */}
      <div className="tag-detail-header">
        <div className="tag-eyebrow">{tag.type}</div>
        <h1 className="tag-name-title">{tag.name}</h1>
        <div className="tag-book-count">{books?.length ?? 0} book{(books?.length ?? 0) !== 1 ? 's' : ''}</div>
      </div>

      {/* BOOK LIST */}
      {books?.length > 0 ? (
        books.map(book => (
          <Link key={book.id} href={`/books/${book.id}`} className="tag-book-row">
            <div className="tb-title">{book.title}</div>
            <span className="tb-author">
              {book.authors?.[0]?.authors?.full_name ?? '—'}
            </span>
            <span className={`tb-value${book.estimated_value_usd ? '' : ' none'}`}>
              {book.estimated_value_usd ? `$${Number(book.estimated_value_usd).toFixed(2)}` : '—'}
            </span>
          </Link>
        ))
      ) : (
        <p className="empty-state">No books tagged with &ldquo;{tag.name}&rdquo; yet.</p>
      )}
    </PageShell>
  )
}
