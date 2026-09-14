import { supabase } from '@/lib/supabase'
import PageShell from '@/app/components/PageShell'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/supabase-server'
import PublisherEditor from '@/app/components/PublisherEditor'

export const dynamic = 'force-dynamic'

export default async function PublisherDetailPage({ params }) {
  const { id } = await params
  const user = await getSession()

  const { data: publisher } = await supabase
    .from('publishers')
    .select('id, name, country, city, website, founded_year, defunct_year, notes')
    .eq('id', id)
    .single()

  if (!publisher) return notFound()

  const { data: books } = await supabase
    .from('books')
    .select('id, title, subtitle, publication_year, estimated_value_usd, cover_image_url, authors:book_authors(authors(full_name))')
    .eq('publisher_id', id)
    .order('publication_year', { ascending: false, nullsFirst: false })

  const rows = books || []
  const totalValue = rows.reduce((s, b) => s + (Number(b.estimated_value_usd) || 0), 0)
  const years = rows.map(b => b.publication_year).filter(Boolean)
  const range = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : null

  return (
    <PageShell active="/publishers">
      <style>{`
        .breadcrumb {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 1.4rem 5rem; border-bottom: 1px solid var(--rule);
        }
        .breadcrumb a, .breadcrumb span {
          font-family: var(--mono); font-size: 0.62rem; letter-spacing: 0.12em;
          text-transform: uppercase; text-decoration: none;
        }
        .breadcrumb a { color: var(--muted); transition: color 0.15s; }
        .breadcrumb a:hover { color: var(--ink); }
        .breadcrumb .sep { color: var(--rule); }
        .breadcrumb .current { color: var(--coral); }

        .pub-header {
          padding: 3.5rem 5rem 3rem;
          border-bottom: 1px solid var(--rule);
          animation: fadeUp 0.5s ease both;
        }
        .pub-eyebrow {
          font-family: var(--mono); font-size: 0.62rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--coral); margin-bottom: 0.8rem;
        }
        .pub-name-title {
          font-family: var(--serif); font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 300; line-height: 1.1; color: var(--ink);
        }
        .pub-meta {
          font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.08em;
          color: var(--muted); margin-top: 1rem;
          display: flex; gap: 1.2rem; flex-wrap: wrap;
        }
        .pub-meta b { color: var(--ink); font-weight: 500; }

        .pub-notes-section {
          padding: 2rem 5rem;
          border-bottom: 1px solid var(--rule);
        }
        .pub-notes {
          font-family: var(--serif); font-size: 1rem; font-weight: 300;
          font-style: italic; color: var(--muted); line-height: 1.7;
          max-width: 780px; white-space: pre-line;
        }

        .books-header {
          padding: 2rem 5rem 1.5rem;
          border-bottom: 1px solid var(--rule);
          font-family: var(--serif); font-size: 1.2rem; font-style: italic;
          font-weight: 300; color: var(--ink);
        }
        .book-row {
          display: grid; grid-template-columns: 1fr auto auto auto;
          align-items: center; padding: 1.15rem 5rem;
          border-bottom: 1px solid var(--rule);
          text-decoration: none; color: inherit;
          transition: background 0.15s;
          gap: 1.5rem;
        }
        .book-row:hover { background: var(--warm-mid); }
        .br-title {
          font-family: var(--serif); font-size: 1.05rem; color: var(--ink);
          transition: color 0.15s;
        }
        .book-row:hover .br-title { color: var(--coral); }
        .br-author {
          font-family: var(--mono); font-size: 0.6rem; color: var(--muted);
          letter-spacing: 0.04em;
        }
        .br-year { font-family: var(--mono); font-size: 0.65rem; color: var(--muted); }
        .br-value { font-family: var(--mono); font-size: 0.7rem; color: var(--coral); }
        .br-value.none { color: var(--muted); }

        .pub-actions { padding: 3rem 5rem; border-top: 1px solid var(--rule); }
        .empty-state {
          font-family: var(--serif); font-size: 0.95rem; font-style: italic;
          color: var(--muted); padding: 2rem 5rem;
        }
        @media (max-width: 768px) {
          .breadcrumb, .pub-header, .pub-notes-section, .books-header, .empty-state, .pub-actions {
            padding-left: 1.25rem; padding-right: 1.25rem;
          }
          .book-row { padding: 1rem 1.25rem; grid-template-columns: 1fr auto; gap: 0.8rem; }
          .br-author, .br-year { display: none; }
        }
      `}</style>

      <div className="breadcrumb">
        <Link href="/publishers">Publishers</Link>
        <span className="sep">/</span>
        <span className="current">{publisher.name}</span>
      </div>

      <div className="pub-header">
        <div className="pub-eyebrow">Publisher</div>
        <h1 className="pub-name-title">{publisher.name}</h1>
        <div className="pub-meta">
          {(publisher.city || publisher.country) && (
            <span>{[publisher.city, publisher.country].filter(Boolean).join(', ')}</span>
          )}
          {(publisher.founded_year || publisher.defunct_year) && (
            <span>
              {publisher.founded_year ? `Founded ${publisher.founded_year}` : '?'}
              {publisher.defunct_year ? ` – ${publisher.defunct_year}` : ''}
            </span>
          )}
          <span><b>{rows.length}</b> book{rows.length !== 1 ? 's' : ''}</span>
          {range && <span>Publishing range {range}</span>}
          {publisher.website && (
            <span>
              <a href={publisher.website.startsWith('http') ? publisher.website : `https://${publisher.website}`}
                 target="_blank" rel="noopener noreferrer"
                 style={{ color: 'var(--coral)', textDecoration: 'none', borderBottom: '1px dotted var(--coral)' }}>
                {publisher.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            </span>
          )}
          {user && totalValue > 0 && <span>${totalValue.toFixed(2)} total</span>}
        </div>
      </div>

      {publisher.notes && (
        <div className="pub-notes-section">
          <p className="pub-notes">{publisher.notes}</p>
        </div>
      )}

      <div className="books-header">Books</div>
      {rows.length > 0 ? (
        rows.map(b => (
          <Link key={b.id} href={`/books/${b.id}`} className="book-row">
            <div className="br-title">{b.title}</div>
            <span className="br-author">{b.authors?.[0]?.authors?.full_name ?? '—'}</span>
            <span className="br-year">{b.publication_year ?? ''}</span>
            <span className={`br-value${b.estimated_value_usd ? '' : ' none'}`}>
              {b.estimated_value_usd ? `$${Number(b.estimated_value_usd).toFixed(2)}` : '—'}
            </span>
          </Link>
        ))
      ) : (
        <p className="empty-state">No books recorded from this publisher yet.</p>
      )}

      {user && (
        <div className="pub-actions">
          <PublisherEditor publisher={publisher} />
        </div>
      )}
    </PageShell>
  )
}
