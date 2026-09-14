import { supabase } from '@/lib/supabase'
import PageShell from '@/app/components/PageShell'
import Link from 'next/link'
import { getSession } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const LOCATION_LABEL = {
  SF: 'San Francisco',
  PH: 'Philippines',
}

function fmtUsd(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default async function AdminPage() {
  const user = await getSession()
  if (!user) redirect('/login')

  const { data: books } = await supabase
    .from('books')
    .select('id, title, location, estimated_value_usd, publication_year, authors:book_authors(authors(full_name))')

  const rows = books || []
  const total = rows.reduce((s, b) => s + (Number(b.estimated_value_usd) || 0), 0)
  const withLocation = rows.filter(b => b.location).length
  const withValue = rows.filter(b => b.estimated_value_usd).length

  // Group by location
  const byLoc = {}
  for (const b of rows) {
    const key = b.location || '__unassigned'
    if (!byLoc[key]) byLoc[key] = { books: [], total: 0 }
    byLoc[key].books.push(b)
    byLoc[key].total += Number(b.estimated_value_usd) || 0
  }
  const locationGroups = Object.entries(byLoc)
    .map(([code, g]) => ({
      code,
      label: code === '__unassigned' ? 'Unassigned' : (LOCATION_LABEL[code] || code),
      count: g.books.length,
      total: g.total,
      valued: g.books.filter(b => b.estimated_value_usd).length,
    }))
    .sort((a, b) => {
      if (a.code === '__unassigned') return 1
      if (b.code === '__unassigned') return -1
      return b.total - a.total
    })

  // Sorted for the master table — location first, then title
  const sortedRows = rows
    .slice()
    .sort((a, b) => {
      const la = a.location || 'zz'
      const lb = b.location || 'zz'
      if (la !== lb) return la.localeCompare(lb)
      return (a.title || '').localeCompare(b.title || '')
    })

  return (
    <PageShell active="/admin">
      <style>{`
        .admin-header {
          padding: 3.5rem 5rem 2rem;
          border-bottom: 1px solid var(--rule);
        }
        .admin-eyebrow {
          font-family: var(--mono); font-size: 0.62rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--coral); margin-bottom: 0.8rem;
        }
        .admin-title {
          font-family: var(--serif); font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 300; font-style: italic; line-height: 1.1; color: var(--ink);
        }
        .admin-sub {
          font-family: var(--mono); font-size: 0.65rem; color: var(--muted);
          letter-spacing: 0.1em; margin-top: 0.8rem;
        }

        .stat-strip {
          display: grid; grid-template-columns: repeat(4, 1fr);
          border-bottom: 1px solid var(--rule);
        }
        .stat-cell {
          padding: 2rem 2.5rem;
          border-right: 1px solid var(--rule);
        }
        .stat-cell:last-child { border-right: none; }
        .stat-num {
          font-family: var(--serif); font-size: 1.8rem; font-weight: 300; color: var(--ink);
        }
        .stat-num .accent { color: var(--coral); }
        .stat-lbl {
          font-family: var(--mono); font-size: 0.55rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--muted); margin-top: 0.5rem;
        }

        .section {
          padding: 3rem 5rem 2rem;
        }
        .section-head {
          display: flex; align-items: baseline; justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        .section-title {
          font-family: var(--serif); font-size: 1.4rem; font-weight: 300;
          font-style: italic; color: var(--ink);
        }
        .section-count {
          font-family: var(--mono); font-size: 0.6rem; color: var(--muted);
          letter-spacing: 0.1em;
        }

        .loc-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }
        .loc-card {
          border: 1px solid var(--rule); padding: 1.5rem;
          text-decoration: none; color: inherit;
          display: flex; flex-direction: column; gap: 0.6rem;
          transition: background 0.15s, border-color 0.15s;
        }
        .loc-card:hover { background: var(--warm-mid); border-color: var(--coral); }
        .loc-code {
          font-family: var(--mono); font-size: 2.2rem; color: var(--coral);
          font-weight: 300; line-height: 1;
        }
        .loc-name {
          font-family: var(--serif); font-size: 1.1rem; color: var(--ink); font-style: italic;
        }
        .loc-stats {
          display: flex; gap: 1.2rem; margin-top: 0.4rem;
        }
        .loc-stat-num {
          font-family: var(--mono); font-size: 0.82rem; color: var(--ink);
        }
        .loc-stat-lbl {
          font-family: var(--mono); font-size: 0.5rem; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--muted);
        }

        .book-table {
          width: 100%; border-collapse: collapse;
          font-family: var(--sans);
        }
        .book-table th {
          font-family: var(--mono); font-size: 0.55rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--muted);
          text-align: left; padding: 0.7rem 0.6rem;
          border-bottom: 1px solid var(--rule);
        }
        .book-table th.num, .book-table td.num { text-align: right; }
        .book-table td {
          padding: 0.7rem 0.6rem; border-bottom: 1px solid var(--rule);
          font-size: 0.78rem; color: var(--ink);
        }
        .book-table td.muted { color: var(--muted); }
        .book-table tr:hover td { background: var(--warm-mid); }
        .book-table a { color: inherit; text-decoration: none; }
        .book-table a:hover { color: var(--coral); }
        .loc-badge {
          display: inline-block; font-family: var(--mono); font-size: 0.55rem;
          letter-spacing: 0.1em; padding: 0.15rem 0.5rem;
          border: 1px solid var(--rule); color: var(--muted);
        }
        .loc-badge.sf { color: var(--coral); border-color: var(--coral); }
        .loc-badge.ph { color: var(--coral); border-color: var(--coral); }
        .val-num { color: var(--coral); font-family: var(--mono); font-size: 0.75rem; }

        @media (max-width: 768px) {
          .admin-header, .section { padding-left: 1.25rem; padding-right: 1.25rem; }
          .stat-strip { grid-template-columns: 1fr 1fr; }
          .stat-cell { padding: 1.4rem 1.25rem; }
          .stat-cell:nth-child(2n) { border-right: none; }
          .book-table th, .book-table td { padding: 0.6rem 0.3rem; font-size: 0.7rem; }
        }
      `}</style>

      <div className="admin-header">
        <div className="admin-eyebrow">Private view</div>
        <h1 className="admin-title">Admin</h1>
        <div className="admin-sub">Location, valuation, and inventory data — hidden from public visitors.</div>
      </div>

      <div className="stat-strip">
        <div className="stat-cell">
          <div className="stat-num">{rows.length}</div>
          <div className="stat-lbl">Books total</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num"><span className="accent">$</span>{Math.round(total).toLocaleString()}</div>
          <div className="stat-lbl">Est. value</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{withLocation}</div>
          <div className="stat-lbl">Location tagged</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{withValue}</div>
          <div className="stat-lbl">Value tracked</div>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <span className="section-title">By location</span>
          <span className="section-count">{locationGroups.length} group{locationGroups.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="loc-grid">
          {locationGroups.map(g => (
            g.code === '__unassigned' ? (
              <div key={g.code} className="loc-card" style={{ cursor: 'default' }}>
                <div className="loc-code" style={{ color: 'var(--muted)' }}>—</div>
                <div className="loc-name">{g.label}</div>
                <div className="loc-stats">
                  <div>
                    <div className="loc-stat-num">{g.count}</div>
                    <div className="loc-stat-lbl">books</div>
                  </div>
                  <div>
                    <div className="loc-stat-num">{fmtUsd(g.total)}</div>
                    <div className="loc-stat-lbl">value</div>
                  </div>
                </div>
              </div>
            ) : (
              <Link key={g.code} href={`/location/${encodeURIComponent(g.code)}`} className="loc-card">
                <div className="loc-code">{g.code}</div>
                <div className="loc-name">{g.label}</div>
                <div className="loc-stats">
                  <div>
                    <div className="loc-stat-num">{g.count}</div>
                    <div className="loc-stat-lbl">books</div>
                  </div>
                  <div>
                    <div className="loc-stat-num">{fmtUsd(g.total)}</div>
                    <div className="loc-stat-lbl">value</div>
                  </div>
                  <div>
                    <div className="loc-stat-num">{g.valued}</div>
                    <div className="loc-stat-lbl">valued</div>
                  </div>
                </div>
              </Link>
            )
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <span className="section-title">All books — private fields</span>
          <span className="section-count">{sortedRows.length} rows</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="book-table">
            <thead>
              <tr>
                <th>Location</th>
                <th>Title</th>
                <th>Author</th>
                <th>Year</th>
                <th className="num">Value</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map(b => {
                const author = b.authors?.[0]?.authors?.full_name || '—'
                const locClass = b.location === 'SF' ? 'sf' : b.location === 'PH' ? 'ph' : ''
                return (
                  <tr key={b.id}>
                    <td>{b.location ? <span className={`loc-badge ${locClass}`}>{b.location}</span> : <span className="muted">—</span>}</td>
                    <td><Link href={`/books/${b.id}`}>{b.title}</Link></td>
                    <td className="muted">{author}</td>
                    <td className="muted">{b.publication_year ?? '—'}</td>
                    <td className="num">{b.estimated_value_usd ? <span className="val-num">{fmtUsd(b.estimated_value_usd)}</span> : <span className="muted">—</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  )
}
