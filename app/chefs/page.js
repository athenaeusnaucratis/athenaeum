import { supabase } from '@/lib/supabase'
import PageShell from '@/app/components/PageShell'
import Link from 'next/link'
import { getSession } from '@/lib/supabase-server'

export const revalidate = 60

export default async function ChefsPage() {
  const user = await getSession()

  const { data: chefs } = await supabase
    .from('chefs')
    .select('id, full_name, sort_name, nationality, photo_url, bio, specialties, birth_year, death_year, restaurants, book_chefs(count)')
    .order('sort_name', { ascending: true, nullsFirst: false })

  const enriched = (chefs || []).map(c => ({
    ...c,
    book_count: c.book_chefs?.[0]?.count || 0,
  }))

  return (
    <PageShell active="/chefs">
      <style>{`
        .chefs-header {
          padding: 3.5rem 5rem 2.5rem;
          border-bottom: 1px solid var(--rule);
          animation: fadeUp 0.6s 0.1s ease both;
          display: flex; justify-content: space-between; align-items: end; gap: 2rem;
        }
        .chefs-header-left { flex: 1; }
        .add-chef-btn {
          font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--parchment); background: var(--coral);
          border: none; padding: 0.6rem 1.2rem; text-decoration: none;
        }
        .add-chef-btn:hover { opacity: 0.85; }
        .chef-list {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          border-bottom: 1px solid var(--rule);
        }
        .chef-card {
          padding: 2rem 2.5rem;
          border-right: 1px solid var(--rule);
          border-bottom: 1px solid var(--rule);
          text-decoration: none; color: inherit;
          display: flex; gap: 1.2rem; align-items: flex-start;
          transition: background 0.2s;
        }
        .chef-card:hover { background: var(--warm-mid); }
        .chef-photo {
          width: 72px; height: 72px; flex-shrink: 0;
          border: 1px solid var(--rule); background: var(--warm-mid);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .chef-photo img { width: 100%; height: 100%; object-fit: cover; }
        .chef-photo-init {
          font-family: var(--serif); font-size: 1.4rem; color: var(--muted); font-style: italic;
        }
        .chef-info { flex: 1; min-width: 0; }
        .chef-name {
          font-family: var(--serif); font-size: 1.15rem; font-weight: 400;
          color: var(--ink); line-height: 1.2; margin-bottom: 0.3rem;
          transition: color 0.15s;
        }
        .chef-card:hover .chef-name { color: var(--coral); }
        .chef-meta {
          font-family: var(--mono); font-size: 0.55rem; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--muted); margin-bottom: 0.5rem;
        }
        .chef-desc {
          font-family: var(--serif); font-size: 0.82rem; color: var(--muted);
          font-style: italic; line-height: 1.4;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .empty-state {
          font-family: var(--serif); font-size: 1rem; font-style: italic;
          color: var(--muted); padding: 3rem 5rem;
        }
        @media (max-width: 640px) {
          .chefs-header { padding: 2rem 1.25rem; flex-direction: column; align-items: stretch; }
          .chef-card { border-right: none; padding: 1.5rem 1.25rem; }
        }
      `}</style>

      <div className="chefs-header">
        <div className="chefs-header-left">
          <div className="page-eyebrow">Reference</div>
          <h1 className="page-title" style={{ fontStyle: 'italic' }}>Chefs</h1>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: '0.65rem',
            color: 'var(--muted)', letterSpacing: '0.1em', marginTop: '0.8rem',
          }}>
            {enriched.length} chef{enriched.length !== 1 ? 's' : ''}
          </div>
        </div>
        {user && <Link href="/chefs/new" className="add-chef-btn">+ Add Chef</Link>}
      </div>

      {enriched.length > 0 ? (
        <div className="chef-list">
          {enriched.map(chef => {
            const initial = (chef.full_name || '?')[0]?.toUpperCase()
            return (
              <Link key={chef.id} href={`/chefs/${chef.id}`} className="chef-card">
                <div className="chef-photo">
                  {chef.photo_url
                    ? <img src={chef.photo_url} alt="" />
                    : <span className="chef-photo-init">{initial}</span>
                  }
                </div>
                <div className="chef-info">
                  <div className="chef-name">{chef.full_name}</div>
                  <div className="chef-meta">
                    {[
                      chef.nationality,
                      (chef.birth_year || chef.death_year) && `${chef.birth_year || '?'}${chef.death_year ? `–${chef.death_year}` : ''}`,
                      chef.book_count && `${chef.book_count} book${chef.book_count !== 1 ? 's' : ''}`,
                    ].filter(Boolean).join(' · ')}
                  </div>
                  {chef.restaurants && (
                    <div className="chef-desc">{chef.restaurants}</div>
                  )}
                  {!chef.restaurants && chef.specialties && (
                    <div className="chef-desc">{chef.specialties}</div>
                  )}
                  {!chef.restaurants && !chef.specialties && chef.bio && (
                    <div className="chef-desc">{chef.bio}</div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <p className="empty-state">
          No chefs added yet. {user && <Link href="/chefs/new" style={{ color: 'var(--coral)' }}>Add the first one</Link>}.
        </p>
      )}
    </PageShell>
  )
}
