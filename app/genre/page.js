import { getAllTags } from '@/lib/books'
import PageShell from '@/app/components/PageShell'
import Link from 'next/link'

const TYPE_LABELS = {
  cuisine: 'Cuisine',
  restaurant: 'Restaurant',
  reference: 'Reference',
  other: 'Other',
}

const TYPE_ORDER = ['cuisine', 'restaurant', 'reference', 'other']

export const dynamic = 'force-dynamic'

export default async function GenrePage() {
  const { data: tags, error } = await getAllTags()

  if (error) return <p style={{ padding: '2rem', color: 'red' }}>Error: {error.message}</p>

  const grouped = {}
  for (const tag of tags ?? []) {
    if (!grouped[tag.type]) grouped[tag.type] = []
    grouped[tag.type].push(tag)
  }

  return (
    <PageShell active="/genre">
      <style>{`
        .genre-header {
          margin-top: 2.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e0e0e0;
        }

        .type-section {
          margin-top: 2.5rem;
        }

        .type-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          font-weight: 400;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #999;
          margin-bottom: 0.75rem;
        }

        .tag-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tag-card {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          font-weight: 300;
          color: #666;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border: 1px solid #e0e0e0;
          transition: all 0.15s ease;
        }

        .tag-card:hover {
          border-color: #2c2c2c;
          color: #2c2c2c;
        }

        .empty-state {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          font-style: italic;
          color: #999;
          margin-top: 3rem;
        }
      `}</style>

      <div className="genre-header">
        <h1 className="page-title">Category</h1>
        <p className="page-subtitle">Browse by category</p>
      </div>

      {TYPE_ORDER.map(type => {
        const typeTags = grouped[type]
        if (!typeTags?.length) return null
        return (
          <div key={type} className="type-section">
            <p className="type-label">{TYPE_LABELS[type]}</p>
            <div className="tag-grid">
              {typeTags.map(tag => (
                <Link key={tag.id} href={`/genre/${tag.id}`} className="tag-card">
                  {tag.name}
                </Link>
              ))}
            </div>
          </div>
        )
      })}

      {(!tags || tags.length === 0) && (
        <p className="empty-state">No tags yet. Tag books from their detail pages to see them here.</p>
      )}
    </PageShell>
  )
}
