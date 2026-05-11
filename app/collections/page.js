import { getAllCollections } from '@/lib/books'
import { supabase } from '@/lib/supabase'
import PageShell from '@/app/components/PageShell'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

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
          margin-top: 2.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e0e0e0;
        }

        .shelf-list {
          margin-top: 1.5rem;
        }

        .shelf-item {
          text-decoration: none;
          color: inherit;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          padding: 1rem 0;
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.1s ease;
        }
        .shelf-item:hover { background: #fafafa; }

        .shelf-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem;
          font-weight: 500;
          color: #2c2c2c;
        }

        .shelf-desc {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.85rem;
          font-style: italic;
          color: #999;
          margin-left: 1rem;
        }

        .shelf-count {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          font-weight: 300;
          color: #999;
          flex-shrink: 0;
        }

        .empty-state {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          font-style: italic;
          color: #999;
          margin-top: 3rem;
        }
      `}</style>

      <div className="shelves-header">
        <h1 className="page-title">Shelves</h1>
        <p className="page-subtitle">Curated collections</p>
      </div>

      {collections?.length > 0 ? (
        <div className="shelf-list">
          {collections.map(col => (
            <Link key={col.id} href={`/collections/${col.id}`} className="shelf-item">
              <div>
                <span className="shelf-name">{col.name}</span>
                {col.description && <span className="shelf-desc">{col.description}</span>}
              </div>
              <span className="shelf-count">{countMap[col.id] ?? 0}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="empty-state">No shelves yet. Create one from any book's detail page.</p>
      )}
    </PageShell>
  )
}
