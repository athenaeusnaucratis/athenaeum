import { supabase } from '@/lib/supabase'
import PageShell from '@/app/components/PageShell'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const LOCATION_LABEL = {
  SF: 'San Francisco',
  PH: 'Philippines',
}

export default async function LocationPage() {
  const { data: books } = await supabase
    .from('books')
    .select('id, title, location, cover_image_url, estimated_value_usd')

  const locMap = {}
  for (const b of books ?? []) {
    if (!b.location) continue
    if (!locMap[b.location]) locMap[b.location] = []
    locMap[b.location].push(b)
  }

  const locations = Object.entries(locMap)
    .map(([code, items]) => ({
      code,
      label: LOCATION_LABEL[code] || code,
      count: items.length,
      samples: items.slice(0, 3),
    }))
    .sort((a, b) => b.count - a.count)

  const totalBooks = (books || []).filter(b => b.location).length
  const unassigned = (books || []).filter(b => !b.location).length

  return (
    <PageShell active="/location">
      <style>{`
        .loc-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          border-bottom: 1px solid var(--rule);
          animation: fadeUp 0.6s 0.15s ease both;
        }
        .loc-card {
          padding: 3.5rem 4rem;
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
        .loc-card:nth-child(2n) { border-right: none; }
        .loc-card:hover { background: var(--warm-mid); }

        .loc-card-top { display: flex; align-items: flex-start; justify-content: space-between; }
        .loc-code {
          font-family: var(--mono); font-size: 3rem; font-weight: 300;
          color: var(--coral); letter-spacing: 0.02em;
        }
        .loc-name {
          font-family: var(--serif); font-size: 1.4rem; font-weight: 300;
          font-style: italic; color: var(--ink); margin-top: 0.4rem;
        }
        .loc-count {
          font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.08em;
          color: var(--muted); text-align: right; white-space: nowrap;
        }
        .loc-samples { display: flex; flex-direction: column; gap: 0.3rem; }
        .loc-sample-item {
          font-family: var(--serif); font-size: 0.85rem; font-style: italic;
          color: var(--muted); line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical;
          overflow: hidden; transition: color 0.15s;
        }
        .loc-card:hover .loc-sample-item { color: var(--ink); }
        .loc-arrow {
          font-family: var(--serif); font-size: 1.2rem; color: var(--rule);
          align-self: flex-end; transition: color 0.2s, transform 0.2s;
        }
        .loc-card:hover .loc-arrow { color: var(--coral); transform: translateX(4px); }

        .unassigned-note {
          font-family: var(--mono); font-size: 0.65rem; color: var(--muted);
          padding: 1.5rem 5rem; letter-spacing: 0.06em;
        }
        .empty-state {
          font-family: var(--serif); font-size: 1rem; font-style: italic;
          color: var(--muted); padding: 3rem 5rem;
        }

        @media (max-width: 640px) {
          .loc-grid { grid-template-columns: 1fr; }
          .loc-card { border-right: none !important; padding: 2rem 1.25rem; }
        }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-eyebrow">Browse by</div>
          <h1 className="page-title" style={{ fontStyle: 'italic' }}>Location</h1>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: '0.65rem',
            color: 'var(--muted)', letterSpacing: '0.1em', marginTop: '0.8rem',
          }}>
            {locations.length} locations · {totalBooks} books assigned
          </div>
        </div>
      </div>

      {locations.length > 0 ? (
        <>
          <div className="loc-grid">
            {locations.map(loc => (
              <Link key={loc.code} href={`/location/${encodeURIComponent(loc.code)}`} className="loc-card">
                <div className="loc-card-top">
                  <div>
                    <div className="loc-code">{loc.code}</div>
                    <div className="loc-name">{loc.label}</div>
                  </div>
                  <div className="loc-count">{loc.count} book{loc.count !== 1 ? 's' : ''}</div>
                </div>
                <div className="loc-samples">
                  {loc.samples.map((b, j) => (
                    <span key={j} className="loc-sample-item">{b.title}</span>
                  ))}
                </div>
                <span className="loc-arrow">→</span>
              </Link>
            ))}
          </div>
          {unassigned > 0 && (
            <p className="unassigned-note">
              {unassigned} book{unassigned !== 1 ? 's' : ''} without a location assigned yet.
            </p>
          )}
        </>
      ) : (
        <p className="empty-state">No locations assigned yet. Set a location on any book from its edit panel.</p>
      )}
    </PageShell>
  )
}
