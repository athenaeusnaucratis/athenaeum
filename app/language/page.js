import { supabase } from '@/lib/supabase'
import PageShell from '@/app/components/PageShell'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LanguagePage() {
  const { data: books } = await supabase
    .from('books')
    .select('id, title, language, cover_image_url, estimated_value_usd, authors:book_authors(authors(full_name))')

  const langMap = {}
  for (const b of books ?? []) {
    if (!b.language) continue
    if (!langMap[b.language]) langMap[b.language] = []
    langMap[b.language].push(b)
  }

  const languages = Object.entries(langMap)
    .map(([name, items]) => ({ name, count: items.length, samples: items.slice(0, 3) }))
    .sort((a, b) => b.count - a.count)

  const totalBooks = (books || []).filter(b => b.language).length
  const maxCount = languages[0]?.count || 1

  return (
    <PageShell active="/language">
      <style>{`
        .lang-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-bottom: 1px solid var(--rule);
          animation: fadeUp 0.6s 0.15s ease both;
        }
        .lang-card {
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
        .lang-card:nth-child(3n) { border-right: none; }
        .lang-card:hover { background: var(--warm-mid); }

        .lang-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }
        .lang-name {
          font-family: var(--serif);
          font-size: 1.7rem;
          font-weight: 300;
          line-height: 1.1;
          color: var(--ink);
          transition: color 0.2s;
        }
        .lang-card:hover .lang-name { color: var(--coral); }

        .lang-count {
          font-family: var(--mono);
          font-size: 0.68rem;
          letter-spacing: 0.08em;
          color: var(--muted);
          padding-top: 0.2rem;
          white-space: nowrap;
        }

        .lang-bar-wrap {
          width: 100%;
          height: 1px;
          background: var(--rule);
          position: relative;
        }
        .lang-bar {
          position: absolute;
          left: 0; top: 0;
          height: 1px;
          background: var(--coral);
          transition: width 0.8s 0.4s ease;
        }

        .lang-samples {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .lang-sample-item {
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
        .lang-card:hover .lang-sample-item { color: var(--ink); }

        .lang-arrow {
          font-family: var(--serif);
          font-size: 1.1rem;
          color: var(--rule);
          align-self: flex-end;
          transition: color 0.2s, transform 0.2s;
        }
        .lang-card:hover .lang-arrow { color: var(--coral); transform: translateX(4px); }

        .empty-state {
          font-family: var(--serif);
          font-size: 1rem;
          font-style: italic;
          color: var(--muted);
          padding: 3rem 5rem;
        }

        @media (max-width: 1024px) {
          .lang-grid { grid-template-columns: repeat(2, 1fr); }
          .lang-card:nth-child(2n) { border-right: none; }
        }
        @media (max-width: 640px) {
          .lang-grid { grid-template-columns: 1fr; }
          .lang-card { border-right: none !important; padding: 2rem 1.25rem; }
        }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-eyebrow">Browse by</div>
          <h1 className="page-title" style={{ fontStyle: 'italic' }}>Language</h1>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: '0.65rem',
            color: 'var(--muted)',
            letterSpacing: '0.1em',
            marginTop: '0.8rem'
          }}>
            {languages.length} languages · {totalBooks} books
          </div>
        </div>
      </div>

      {languages.length > 0 ? (
        <div className="lang-grid">
          {languages.map(lang => {
            const pct = Math.round((lang.count / maxCount) * 100)
            return (
              <Link key={lang.name} href={`/language/${encodeURIComponent(lang.name)}`} className="lang-card">
                <div className="lang-card-top">
                  <div className="lang-name">{lang.name}</div>
                  <div className="lang-count">{lang.count} book{lang.count !== 1 ? 's' : ''}</div>
                </div>
                <div className="lang-bar-wrap">
                  <div className="lang-bar" style={{ width: `${pct}%` }}></div>
                </div>
                <div className="lang-samples">
                  {lang.samples.map((b, j) => (
                    <span key={j} className="lang-sample-item">{b.title}</span>
                  ))}
                </div>
                <span className="lang-arrow">→</span>
              </Link>
            )
          })}
        </div>
      ) : (
        <p className="empty-state">No languages recorded yet. Add language info from book detail pages.</p>
      )}
    </PageShell>
  )
}
