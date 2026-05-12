import { supabase } from '@/lib/supabase'
import PageShell from '@/app/components/PageShell'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function GenrePage() {
  // Get all tags with their book counts and sample titles
  const { data: tags, error } = await supabase
    .from('tags')
    .select('id, name, type')
    .order('name')

  if (error) return <p style={{ padding: '2rem', color: 'red' }}>Error: {error.message}</p>

  // Get all book_tags with book titles
  const { data: bookTags } = await supabase
    .from('book_tags')
    .select('tag_id, books(title)')

  const tagInfo = {}
  for (const bt of bookTags ?? []) {
    if (!tagInfo[bt.tag_id]) tagInfo[bt.tag_id] = []
    if (bt.books?.title) tagInfo[bt.tag_id].push(bt.books.title)
  }

  // Get language counts
  const { data: langBooks } = await supabase
    .from('books')
    .select('language')
  const langCounts = {}
  for (const b of langBooks ?? []) {
    if (b.language) langCounts[b.language] = (langCounts[b.language] || 0) + 1
  }
  const languages = Object.entries(langCounts).sort((a, b) => b[1] - a[1])

  // Enrich tags with counts
  const enriched = (tags || []).map(t => ({
    ...t,
    count: tagInfo[t.id]?.length || 0,
    sampleTitles: (tagInfo[t.id] || []).slice(0, 3),
  })).filter(t => t.count > 0).sort((a, b) => b.count - a.count)

  const maxCount = enriched[0]?.count || 1
  const totalBooks = (langBooks || []).length
  const featured = enriched.slice(0, 2)
  const rest = enriched.slice(2)

  return (
    <PageShell active="/genre">
      <style>{`
        /* ── FEATURED ── */
        .featured {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid var(--rule);
          animation: fadeUp 0.6s 0.15s ease both;
        }

        .featured-cell {
          padding: 4rem 5rem;
          cursor: pointer;
          transition: background 0.25s;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 2.5rem;
          border-right: 1px solid var(--rule);
          text-decoration: none;
          color: inherit;
        }
        .featured-cell:last-child { border-right: none; }
        .featured-cell:hover { background: var(--warm-mid); }

        .featured-index {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          color: var(--rule);
        }

        .featured-name {
          font-family: var(--serif);
          font-size: clamp(2.8rem, 5vw, 5rem);
          font-weight: 300;
          line-height: 0.95;
          color: var(--ink);
          transition: color 0.25s;
        }
        .featured-cell:hover .featured-name { color: var(--coral); }

        .featured-footer {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
        }

        .featured-titles {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .featured-title-item {
          font-family: var(--serif);
          font-size: 0.82rem;
          font-style: italic;
          color: var(--muted);
          line-height: 1.3;
        }

        .featured-count-num {
          font-family: var(--serif);
          font-size: 3.5rem;
          font-weight: 300;
          line-height: 1;
          color: var(--rule);
          transition: color 0.25s;
        }
        .featured-cell:hover .featured-count-num { color: var(--coral); opacity: 0.4; }

        .featured-count-label {
          font-family: var(--mono);
          font-size: 0.58rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
          margin-top: 0.2rem;
          text-align: right;
        }

        /* ── CATEGORY GRID ── */
        .cat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-bottom: 1px solid var(--rule);
          animation: fadeUp 0.6s 0.25s ease both;
        }

        .cat-cell {
          padding: 2.8rem 3.5rem;
          border-right: 1px solid var(--rule);
          border-bottom: 1px solid var(--rule);
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          flex-direction: column;
          gap: 1.4rem;
          text-decoration: none;
          color: inherit;
        }
        .cat-cell:nth-child(3n) { border-right: none; }
        .cat-cell:hover { background: var(--warm-mid); }

        .cat-cell-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .cat-name {
          font-family: var(--serif);
          font-size: 1.7rem;
          font-weight: 300;
          line-height: 1.1;
          color: var(--ink);
          transition: color 0.2s;
        }
        .cat-cell:hover .cat-name { color: var(--coral); }

        .cat-count {
          font-family: var(--mono);
          font-size: 0.68rem;
          letter-spacing: 0.08em;
          color: var(--muted);
          padding-top: 0.2rem;
          white-space: nowrap;
        }

        .cat-bar-wrap {
          width: 100%;
          height: 1px;
          background: var(--rule);
          position: relative;
        }

        .cat-bar {
          position: absolute;
          left: 0; top: 0;
          height: 1px;
          background: var(--coral);
          transition: width 0.8s 0.4s ease;
        }

        .cat-titles {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .cat-title-item {
          font-family: var(--serif);
          font-size: 0.78rem;
          font-style: italic;
          color: var(--muted);
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.15s;
        }
        .cat-cell:hover .cat-title-item { color: var(--ink); }

        .cat-arrow {
          font-family: var(--serif);
          font-size: 1.1rem;
          color: var(--rule);
          align-self: flex-end;
          transition: color 0.2s, transform 0.2s;
        }
        .cat-cell:hover .cat-arrow { color: var(--coral); transform: translateX(4px); }

        /* ── LANGUAGE STRIP ── */
        .lang-strip {
          display: flex;
          border-bottom: 1px solid var(--rule);
          animation: fadeUp 0.6s 0.38s ease both;
        }

        .lang-header {
          padding: 2rem 3.5rem;
          border-right: 1px solid var(--rule);
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 220px;
        }

        .lang-header-label {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 0.5rem;
        }

        .lang-header-title {
          font-family: var(--serif);
          font-size: 1.2rem;
          font-style: italic;
          font-weight: 300;
          color: var(--ink);
        }

        .lang-cells {
          display: flex;
          flex: 1;
        }

        .lang-cell {
          flex: 1;
          padding: 2rem 2.5rem;
          border-right: 1px solid var(--rule);
          transition: background 0.2s;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .lang-cell:last-child { border-right: none; }
        .lang-cell:hover { background: var(--warm-mid); }

        .lang-name {
          font-family: var(--serif);
          font-size: 1.1rem;
          font-weight: 300;
          color: var(--ink);
          transition: color 0.2s;
        }
        .lang-cell:hover .lang-name { color: var(--coral); }

        .lang-count {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          color: var(--muted);
        }

        .lang-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--rule);
          margin-top: auto;
          transition: background 0.2s;
        }
        .lang-cell:hover .lang-dot { background: var(--coral); }

        .empty-state {
          font-family: var(--serif);
          font-size: 1rem;
          font-style: italic;
          color: var(--muted);
          padding: 3rem 5rem;
        }

        @media (max-width: 1024px) {
          .featured { grid-template-columns: 1fr; }
          .featured-cell { border-right: none; border-bottom: 1px solid var(--rule); }
          .cat-grid { grid-template-columns: repeat(2, 1fr); }
          .cat-cell:nth-child(2n) { border-right: none; }
          .lang-strip { flex-direction: column; }
          .lang-header { border-right: none; border-bottom: 1px solid var(--rule); min-width: auto; }
          .lang-cells { flex-wrap: wrap; }
        }
        @media (max-width: 640px) {
          .featured-cell { padding: 2.5rem 1.25rem; }
          .cat-grid { grid-template-columns: 1fr; }
          .cat-cell { border-right: none !important; }
          .cat-cell { padding: 2rem 1.25rem; }
          .lang-cell { padding: 1.5rem 1.25rem; }
        }
      `}</style>

      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Browse by</div>
          <h1 className="page-title" style={{ fontStyle: 'italic' }}>Category</h1>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: '0.65rem',
            color: 'var(--muted)',
            letterSpacing: '0.1em',
            marginTop: '0.8rem'
          }}>
            {enriched.length} categories · {totalBooks} books
          </div>
        </div>
      </div>

      {/* FEATURED: two largest categories */}
      {featured.length >= 2 && (
        <div className="featured">
          {featured.map((tag, i) => (
            <Link key={tag.id} href={`/genre/${tag.id}`} className="featured-cell">
              <div className="featured-index">{String(i + 1).padStart(2, '0')}{i === 0 ? ' — Largest' : ''}</div>
              <div className="featured-name">{tag.name}</div>
              <div className="featured-footer">
                <div className="featured-titles">
                  {tag.sampleTitles.map((t, j) => (
                    <span key={j} className="featured-title-item">{t}</span>
                  ))}
                  {tag.count > 3 && (
                    <span className="featured-title-item" style={{ color: 'var(--rule)' }}>+ {tag.count - 3} more</span>
                  )}
                </div>
                <div>
                  <div className="featured-count-num">{tag.count}</div>
                  <div className="featured-count-label">volumes</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* CATEGORY GRID */}
      {rest.length > 0 && (
        <div className="cat-grid">
          {rest.map(tag => {
            const pct = Math.round((tag.count / maxCount) * 100)
            return (
              <Link key={tag.id} href={`/genre/${tag.id}`} className="cat-cell">
                <div className="cat-cell-top">
                  <div className="cat-name">{tag.name}</div>
                  <div className="cat-count">{tag.count} book{tag.count !== 1 ? 's' : ''}</div>
                </div>
                <div className="cat-bar-wrap">
                  <div className="cat-bar" style={{ width: `${pct}%` }}></div>
                </div>
                <div className="cat-titles">
                  {tag.sampleTitles.map((t, j) => (
                    <span key={j} className="cat-title-item">{t}</span>
                  ))}
                </div>
                <span className="cat-arrow">→</span>
              </Link>
            )
          })}
        </div>
      )}

      {/* LANGUAGE STRIP */}
      {languages.length > 0 && (
        <div className="lang-strip">
          <div className="lang-header">
            <div className="lang-header-label">Also browse by</div>
            <div className="lang-header-title">Language</div>
          </div>
          <div className="lang-cells">
            {languages.map(([lang, count]) => (
              <div key={lang} className="lang-cell">
                <div className="lang-name">{lang}</div>
                <div className="lang-count">{count} book{count !== 1 ? 's' : ''}</div>
                <div className="lang-dot"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {enriched.length === 0 && (
        <p className="empty-state">No categories yet. Tag books from their detail pages to see them here.</p>
      )}
    </PageShell>
  )
}
