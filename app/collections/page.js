import { getAllCollections } from '@/lib/books'
import { supabase } from '@/lib/supabase'
import PageShell from '@/app/components/PageShell'
import Link from 'next/link'

export default async function CollectionsPage() {
  const { data: collections, error } = await getAllCollections()

  if (error) return <p style={{ padding: '2rem', color: 'red' }}>Error: {error.message}</p>

  // Get book counts per collection
  const { data: counts } = await supabase
    .from('book_collections')
    .select('collection_id')

  const countMap = {}
  for (const c of counts ?? []) {
    countMap[c.collection_id] = (countMap[c.collection_id] ?? 0) + 1
  }

  return (
    <PageShell active="/collections">
      <style>{`
        .shelves-header {
          margin-top: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #d4cfc8;
        }

        .shelf-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }

        .shelf-card {
          text-decoration: none;
          color: inherit;
          padding: 1.5rem;
          border: 1px solid #e8e4de;
          transition: all 0.15s ease;
        }
        .shelf-card:hover { border-color: #e8694a; }

        .shelf-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.4rem;
          font-weight: 600;
          color: #1a1814;
        }

        .shelf-desc {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.9rem;
          font-style: italic;
          color: #9c8e7e;
          margin-top: 0.3rem;
        }

        .shelf-count {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          font-weight: 300;
          color: #e8694a;
          margin-top: 0.75rem;
        }

        .empty-state {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          font-style: italic;
          color: #9c8e7e;
          margin-top: 3rem;
        }
      `}</style>

      <div className="shelves-header">
        <h1 className="page-title">Shelves</h1>
        <p className="page-subtitle">Curated collections</p>
      </div>

      {collections?.length > 0 ? (
        <div className="shelf-grid">
          {collections.map(col => (
            <Link key={col.id} href={`/collections/${col.id}`} className="shelf-card">
              <div className="shelf-name">{col.name}</div>
              {col.description && <div className="shelf-desc">{col.description}</div>}
              <div className="shelf-count">{countMap[col.id] ?? 0} books</div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="empty-state">No shelves yet. Create one from any book's detail page.</p>
      )}
    </PageShell>
  )
}
