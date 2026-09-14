import { supabase } from '@/lib/supabase'
import PageShell from '@/app/components/PageShell'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PublishersPage() {
  const { data: publishers } = await supabase
    .from('publishers')
    .select('id, name, country, city, founded_year, books(count)')
    .order('name', { ascending: true, nullsFirst: false })

  const enriched = (publishers || []).map(p => ({
    ...p,
    book_count: p.books?.[0]?.count || 0,
  }))

  const withBooks = enriched.filter(p => p.book_count > 0)
  const noBooks = enriched.filter(p => p.book_count === 0)

  const totalBooks = enriched.reduce((s, p) => s + p.book_count, 0)

  return (
    <PageShell active="/publishers">
      <style>{`
        .pubs-header {
          padding: 3.5rem 5rem 2.5rem;
          border-bottom: 1px solid var(--rule);
          animation: fadeUp 0.6s 0.1s ease both;
        }
        .pubs-list {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          border-bottom: 1px solid var(--rule);
        }
        .pub-card {
          padding: 1.6rem 2rem;
          border-right: 1px solid var(--rule);
          border-bottom: 1px solid var(--rule);
          text-decoration: none; color: inherit;
          display: flex; flex-direction: column; gap: 0.35rem;
          transition: background 0.2s;
        }
        .pub-card:hover { background: var(--warm-mid); }
        .pub-name {
          font-family: var(--serif); font-size: 1.05rem; font-weight: 400;
          color: var(--ink); line-height: 1.3;
          transition: color 0.15s;
        }
        .pub-card:hover .pub-name { color: var(--coral); }
        .pub-meta {
          font-family: var(--mono); font-size: 0.58rem; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--muted);
        }
        .pub-meta b { color: var(--ink); font-weight: 500; }
        .pub-card.zero .pub-name { color: var(--muted); }
        .pub-card.zero:hover .pub-name { color: var(--ink); }

        .section-divider {
          padding: 2.2rem 5rem 1rem;
          border-bottom: 1px solid var(--rule);
          font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--muted);
        }
        .empty-state {
          font-family: var(--serif); font-size: 1rem; font-style: italic;
          color: var(--muted); padding: 3rem 5rem;
        }
        @media (max-width: 640px) {
          .pubs-header, .section-divider, .empty-state { padding-left: 1.25rem; padding-right: 1.25rem; }
          .pub-card { padding: 1.25rem 1.25rem; border-right: none; }
        }
      `}</style>

      <div className="pubs-header">
        <div className="page-eyebrow">Reference</div>
        <h1 className="page-title" style={{ fontStyle: 'italic' }}>Publishers</h1>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: '0.65rem',
          color: 'var(--muted)', letterSpacing: '0.1em', marginTop: '0.8rem',
        }}>
          {enriched.length} publisher{enriched.length !== 1 ? 's' : ''} · {totalBooks} book{totalBooks !== 1 ? 's' : ''}
        </div>
      </div>

      {withBooks.length > 0 && (
        <div className="pubs-list">
          {withBooks.map(pub => (
            <Link key={pub.id} href={`/publishers/${pub.id}`} className="pub-card">
              <div className="pub-name">{pub.name}</div>
              <div className="pub-meta">
                <b>{pub.book_count}</b> book{pub.book_count !== 1 ? 's' : ''}
                {(pub.city || pub.country) && ` · ${[pub.city, pub.country].filter(Boolean).join(', ')}`}
                {pub.founded_year && ` · est. ${pub.founded_year}`}
              </div>
            </Link>
          ))}
        </div>
      )}

      {noBooks.length > 0 && (
        <>
          <div className="section-divider">Publishers with no books ({noBooks.length})</div>
          <div className="pubs-list">
            {noBooks.map(pub => (
              <Link key={pub.id} href={`/publishers/${pub.id}`} className="pub-card zero">
                <div className="pub-name">{pub.name}</div>
                <div className="pub-meta">
                  {[pub.city, pub.country].filter(Boolean).join(', ') || '—'}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {enriched.length === 0 && (
        <p className="empty-state">No publishers yet.</p>
      )}
    </PageShell>
  )
}
