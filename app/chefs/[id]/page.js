import { supabase } from '@/lib/supabase'
import PageShell from '@/app/components/PageShell'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/supabase-server'
import EditableBio from '@/app/components/EditableBio'
import ChefEditor from '@/app/components/ChefEditor'
import DeleteChefButton from '@/app/components/DeleteChefButton'

export const dynamic = 'force-dynamic'

export default async function ChefDetailPage({ params }) {
  const { id } = await params
  const user = await getSession()

  const { data: chef } = await supabase
    .from('chefs')
    .select('id, full_name, sort_name, bio, photo_url, nationality, birth_year, death_year, restaurants, specialties, notes')
    .eq('id', id)
    .single()

  if (!chef) return notFound()

  // Books linked to this chef
  const { data: bookLinks } = await supabase
    .from('book_chefs')
    .select('books(id, title, publication_year, cover_image_url, estimated_value_usd)')
    .eq('chef_id', id)
    .order('chef_order')

  const books = (bookLinks || []).map(l => l.books).filter(Boolean)

  return (
    <PageShell active="/chefs">
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
        .breadcrumb span.current { color: var(--coral); }

        .chef-detail-header {
          padding: 3.5rem 5rem 3rem;
          border-bottom: 1px solid var(--rule);
          display: flex; gap: 3rem; align-items: flex-start;
        }
        .chef-photo-lg {
          width: 160px; height: 160px; flex-shrink: 0;
          border: 1px solid var(--rule); background: var(--warm-mid);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .chef-photo-lg img { width: 100%; height: 100%; object-fit: cover; }
        .chef-photo-init {
          font-family: var(--serif); font-size: 3rem; color: var(--muted); font-style: italic;
        }
        .chef-detail-info { flex: 1; min-width: 0; }
        .chef-eyebrow {
          font-family: var(--mono); font-size: 0.62rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--coral); margin-bottom: 0.8rem;
        }
        .chef-detail-name {
          font-family: var(--serif); font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 300; line-height: 1.1; color: var(--ink);
        }
        .chef-detail-meta {
          font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.08em;
          color: var(--muted); margin-top: 1rem;
          display: flex; gap: 1.2rem; flex-wrap: wrap;
        }
        .chef-detail-meta span { display: flex; align-items: center; gap: 0.4rem; }

        .author-bio-section {
          padding: 2.5rem 5rem;
          border-bottom: 1px solid var(--rule);
        }
        .bio-text {
          font-family: var(--serif); font-size: 1rem; font-weight: 300;
          font-style: italic; color: var(--muted); line-height: 1.8;
          max-width: 780px; white-space: pre-line;
        }

        .books-header {
          padding: 2rem 5rem 1.5rem;
          border-bottom: 1px solid var(--rule);
          font-family: var(--serif); font-size: 1.2rem; font-style: italic;
          font-weight: 300; color: var(--ink);
        }
        .book-row {
          display: grid; grid-template-columns: 1fr auto auto;
          align-items: center; padding: 1.2rem 5rem;
          border-bottom: 1px solid var(--rule);
          text-decoration: none; color: inherit;
          transition: background 0.15s;
        }
        .book-row:hover { background: var(--warm-mid); }
        .br-title {
          font-family: var(--serif); font-size: 1.05rem; color: var(--ink);
          transition: color 0.15s;
        }
        .book-row:hover .br-title { color: var(--coral); }
        .br-year {
          font-family: var(--mono); font-size: 0.65rem; color: var(--muted);
          padding: 0 2rem;
        }
        .br-value {
          font-family: var(--mono); font-size: 0.7rem; color: var(--coral);
        }
        .br-value.none { color: var(--muted); }

        .chef-actions {
          padding: 3rem 5rem;
          border-top: 1px solid var(--rule);
        }

        .empty-state {
          font-family: var(--serif); font-size: 0.95rem; font-style: italic;
          color: var(--muted); padding: 2rem 5rem;
        }
        @media (max-width: 768px) {
          .breadcrumb { padding: 1rem 1.25rem; }
          .chef-detail-header { padding: 2rem 1.25rem; gap: 1.5rem; }
          .chef-photo-lg { width: 100px; height: 100px; }
          .author-bio-section { padding: 2rem 1.25rem; }
          .books-header { padding: 1.5rem 1.25rem; }
          .book-row { padding: 1rem 1.25rem; grid-template-columns: 1fr auto; }
          .br-year { display: none; }
          .chef-actions { padding: 2rem 1.25rem; }
        }
      `}</style>

      <div className="breadcrumb">
        <Link href="/chefs">Chefs</Link>
        <span className="sep">/</span>
        <span className="current">{chef.full_name}</span>
      </div>

      <div className="chef-detail-header">
        <div className="chef-photo-lg">
          {chef.photo_url
            ? <img src={chef.photo_url} alt="" />
            : <span className="chef-photo-init">{(chef.full_name || '?')[0]?.toUpperCase()}</span>
          }
        </div>
        <div className="chef-detail-info">
          <div className="chef-eyebrow">Chef</div>
          <h1 className="chef-detail-name">{chef.full_name}</h1>
          <div className="chef-detail-meta">
            {chef.nationality && <span>{chef.nationality}</span>}
            {(chef.birth_year || chef.death_year) && (
              <span>
                {chef.birth_year || '?'}
                {chef.death_year ? ` – ${chef.death_year}` : ''}
              </span>
            )}
            {chef.restaurants && <span style={{ fontStyle: 'italic' }}>{chef.restaurants}</span>}
            {chef.specialties && <span style={{ fontStyle: 'italic', opacity: 0.85 }}>{chef.specialties}</span>}
            <span>{books.length} book{books.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <EditableBio authorId={id} initialText={chef.bio} canEdit={!!user} apiBase="chefs" />

      <div className="books-header">Books</div>
      {books.length > 0 ? (
        books.map(b => (
          <Link key={b.id} href={`/books/${b.id}`} className="book-row">
            <div className="br-title">{b.title}</div>
            <span className="br-year">{b.publication_year ?? ''}</span>
            <span className={`br-value${b.estimated_value_usd ? '' : ' none'}`}>
              {b.estimated_value_usd ? `$${Number(b.estimated_value_usd).toFixed(2)}` : '—'}
            </span>
          </Link>
        ))
      ) : (
        <p className="empty-state">No books linked to this chef yet. Tag books from their edit panel.</p>
      )}

      {user && (
        <div className="chef-actions">
          <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
            <ChefEditor chef={chef} />
            <DeleteChefButton chefId={id} chefName={chef.full_name} />
          </div>
        </div>
      )}
    </PageShell>
  )
}
