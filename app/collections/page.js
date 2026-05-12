import { supabase } from '@/lib/supabase'
import PageShell from '@/app/components/PageShell'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CollectionsPage() {
  const { data: collections, error } = await supabase
    .from('collections')
    .select('id, name, description')
    .order('name')

  if (error) return <p style={{ padding: '2rem', color: 'red' }}>Error: {error.message}</p>

  // Get all book_collections with book data
  const { data: bookColls } = await supabase
    .from('book_collections')
    .select('collection_id, books(title, estimated_value_usd, publication_year, authors:book_authors(authors(full_name)))')

  const collInfo = {}
  for (const bc of bookColls ?? []) {
    if (!collInfo[bc.collection_id]) collInfo[bc.collection_id] = []
    if (bc.books) collInfo[bc.collection_id].push(bc.books)
  }

  // Enrich collections
  const enriched = (collections || []).map(c => {
    const books = collInfo[c.id] || []
    const totalValue = books.reduce((s, b) => s + (Number(b.estimated_value_usd) || 0), 0)
    const sampleTitles = books.slice(0, 3).map(b => {
      const author = b.authors?.[0]?.authors?.full_name
      return author ? `${b.title} — ${author}` : b.title
    })
    return { ...c, count: books.length, totalValue, sampleTitles, books }
  }).sort((a, b) => b.count - a.count)

  const totalBooks = enriched.reduce((s, c) => s + c.count, 0)

  // Featured = largest collection
  const featured = enriched[0]
  const rest = enriched.slice(1)

  // Spine color classes
  const spineColors = ['#221f1a', '#1a1f1a', '#201a18', '#181c22', '#1e1e18']

  return (
    <PageShell active="/collections">
      <style>{`
        /* ── FEATURED COLLECTION ── */
        .featured-collection {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid var(--rule);
          animation: fadeUp 0.6s 0.15s ease both;
          cursor: pointer;
          transition: background 0.25s;
          text-decoration: none;
          color: inherit;
        }
        .featured-collection:hover { background: var(--warm-mid); }

        .featured-left {
          padding: 4rem 5rem;
          border-right: 1px solid var(--rule);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 3rem;
        }

        .featured-tag {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--coral);
        }

        .featured-coll-title {
          font-family: var(--serif);
          font-size: clamp(2.2rem, 4vw, 4rem);
          font-weight: 300;
          line-height: 1.05;
          color: var(--ink);
        }

        .featured-desc {
          font-family: var(--sans);
          font-size: 0.78rem;
          font-weight: 300;
          color: var(--muted);
          line-height: 1.8;
          letter-spacing: 0.02em;
          max-width: 38ch;
          margin-top: 1rem;
        }

        .featured-meta {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .featured-stat {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .featured-stat-val {
          font-family: var(--serif);
          font-size: 1.8rem;
          font-weight: 300;
          color: var(--ink);
          line-height: 1;
        }

        .featured-stat-label {
          font-family: var(--mono);
          font-size: 0.58rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .featured-divider { width: 1px; height: 40px; background: var(--rule); }

        /* Featured book stack */
        .featured-right {
          padding: 4rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .stack-row {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.1rem 0;
          border-bottom: 1px solid var(--rule);
        }
        .stack-row:first-child { border-top: 1px solid var(--rule); }

        .stack-num {
          font-family: var(--mono);
          font-size: 0.58rem;
          letter-spacing: 0.12em;
          color: var(--rule);
          min-width: 1.5rem;
        }

        .stack-cover {
          width: 32px;
          height: 48px;
          border: 1px solid var(--rule);
          flex-shrink: 0;
        }

        .stack-info { flex: 1; min-width: 0; }

        .stack-title {
          font-family: var(--serif);
          font-size: 0.9rem;
          font-weight: 400;
          color: var(--ink);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .stack-author {
          font-family: var(--mono);
          font-size: 0.6rem;
          color: var(--muted);
          letter-spacing: 0.04em;
          margin-top: 0.2rem;
        }

        .stack-year {
          font-family: var(--mono);
          font-size: 0.6rem;
          color: var(--muted);
          letter-spacing: 0.06em;
          white-space: nowrap;
        }

        /* ── COLLECTIONS GRID ── */
        .collections-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-bottom: 1px solid var(--rule);
          animation: fadeUp 0.6s 0.28s ease both;
        }

        .coll-card {
          padding: 3rem 3.5rem;
          border-right: 1px solid var(--rule);
          border-bottom: 1px solid var(--rule);
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          flex-direction: column;
          gap: 1.6rem;
          text-decoration: none;
          color: inherit;
        }
        .coll-card:nth-child(3n) { border-right: none; }
        .coll-card:hover { background: var(--warm-mid); }

        .coll-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }

        .coll-name {
          font-family: var(--serif);
          font-size: 1.5rem;
          font-weight: 300;
          line-height: 1.15;
          color: var(--ink);
          transition: color 0.2s;
        }
        .coll-card:hover .coll-name { color: var(--coral); }

        .coll-count-badge {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          color: var(--muted);
          border: 1px solid var(--rule);
          padding: 0.25rem 0.6rem;
          white-space: nowrap;
          flex-shrink: 0;
          transition: border-color 0.2s, color 0.2s;
        }
        .coll-card:hover .coll-count-badge { border-color: var(--coral); color: var(--coral); }

        .coll-spines {
          display: flex;
          gap: 3px;
          height: 56px;
          align-items: flex-end;
        }

        .spine {
          height: 100%;
          width: 14px;
          border: 1px solid var(--rule);
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .coll-card:hover .spine { opacity: 1; }

        .coll-titles {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .coll-title-item {
          font-family: var(--serif);
          font-size: 0.78rem;
          font-style: italic;
          color: var(--muted);
          line-height: 1.3;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          transition: color 0.15s;
        }
        .coll-card:hover .coll-title-item { color: var(--ink); }

        .coll-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
        }

        .coll-value {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.08em;
          color: var(--muted);
        }
        .coll-value strong { color: var(--coral); font-weight: 400; }

        .coll-arrow {
          font-family: var(--serif);
          font-size: 1rem;
          color: var(--rule);
          transition: color 0.2s, transform 0.2s;
        }
        .coll-card:hover .coll-arrow { color: var(--coral); transform: translateX(4px); }

        .empty-state {
          font-family: var(--serif);
          font-size: 1rem;
          font-style: italic;
          color: var(--muted);
          padding: 3rem 5rem;
        }

        @media (max-width: 1024px) {
          .featured-collection { grid-template-columns: 1fr; }
          .featured-left { border-right: none; border-bottom: 1px solid var(--rule); }
          .collections-grid { grid-template-columns: repeat(2, 1fr); }
          .coll-card:nth-child(2n) { border-right: none; }
        }
        @media (max-width: 640px) {
          .featured-left { padding: 2.5rem 1.25rem; }
          .featured-right { padding: 2rem 1.25rem; }
          .collections-grid { grid-template-columns: 1fr; }
          .coll-card { border-right: none !important; padding: 2rem 1.25rem; }
        }
      `}</style>

      {/* PAGE HEADER */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="page-eyebrow">Curated</div>
          <h1 className="page-title" style={{ fontStyle: 'italic' }}>Collections</h1>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: '0.65rem',
            color: 'var(--muted)',
            letterSpacing: '0.1em',
            marginTop: '0.8rem'
          }}>
            {enriched.length} collection{enriched.length !== 1 ? 's' : ''} · {totalBooks} books
          </div>
        </div>
      </div>

      {/* FEATURED COLLECTION */}
      {featured && featured.count > 0 && (
        <Link href={`/collections/${featured.id}`} className="featured-collection">
          <div className="featured-left">
            <div className="featured-tag">Largest collection</div>
            <div>
              <div className="featured-coll-title">{featured.name}</div>
              {featured.description && <p className="featured-desc">{featured.description}</p>}
            </div>
            <div className="featured-meta">
              <div className="featured-stat">
                <span className="featured-stat-val">{featured.count}</span>
                <span className="featured-stat-label">volumes</span>
              </div>
              <div className="featured-divider"></div>
              <div className="featured-stat">
                <span className="featured-stat-val">${Math.round(featured.totalValue)}</span>
                <span className="featured-stat-label">est. value</span>
              </div>
              {featured.books.length > 0 && (() => {
                const years = featured.books.map(b => b.publication_year).filter(Boolean)
                if (years.length === 0) return null
                const min = Math.min(...years)
                const max = Math.max(...years)
                return (
                  <>
                    <div className="featured-divider"></div>
                    <div className="featured-stat">
                      <span className="featured-stat-val">{min === max ? min : `${min}–${String(max).slice(2)}`}</span>
                      <span className="featured-stat-label">span</span>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>

          <div className="featured-right">
            {featured.books.slice(0, 5).map((book, i) => (
              <div key={i} className="stack-row">
                <span className="stack-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="stack-cover" style={{ background: spineColors[i % 5] }}></div>
                <div className="stack-info">
                  <div className="stack-title">{book.title}</div>
                  <div className="stack-author">{book.authors?.[0]?.authors?.full_name ?? ''}</div>
                </div>
                <span className="stack-year">{book.publication_year ?? ''}</span>
              </div>
            ))}
          </div>
        </Link>
      )}

      {/* COLLECTIONS GRID */}
      {rest.length > 0 && (
        <div className="collections-grid">
          {rest.map((coll, ci) => (
            <Link key={coll.id} href={`/collections/${coll.id}`} className="coll-card">
              <div className="coll-card-top">
                <div className="coll-name">{coll.name}</div>
                <div className="coll-count-badge">{coll.count} book{coll.count !== 1 ? 's' : ''}</div>
              </div>
              <div className="coll-spines">
                {Array.from({ length: Math.min(coll.count, 8) }).map((_, si) => (
                  <div
                    key={si}
                    className="spine"
                    style={{
                      background: spineColors[(ci + si) % 5],
                      height: `${70 + Math.random() * 30}%`
                    }}
                  ></div>
                ))}
              </div>
              <div className="coll-titles">
                {coll.sampleTitles.map((t, j) => (
                  <span key={j} className="coll-title-item">{t}</span>
                ))}
              </div>
              <div className="coll-footer">
                <span className="coll-value">Est. <strong>${Math.round(coll.totalValue)}</strong></span>
                <span className="coll-arrow">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {enriched.length === 0 && (
        <p className="empty-state">No collections yet. Create one from any book&rsquo;s detail page.</p>
      )}
    </PageShell>
  )
}
