import { getCollectionStats } from '@/lib/books'
import PageShell from '@/app/components/PageShell'
import Link from 'next/link'

export default async function Home() {
  const stats = await getCollectionStats()

  return (
    <PageShell active="/">
      <style>{`
        .hero {
          padding: 4rem 0 3rem;
          border-bottom: 1px solid #e0e0e0;
        }

        .hero h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.8rem;
          font-weight: 500;
          line-height: 1.1;
          color: #2c2c2c;
        }

        .hero p {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          font-weight: 300;
          color: #999;
          letter-spacing: 0.06em;
          margin-top: 0.6rem;
        }

        .stats-row {
          display: flex;
          gap: 3rem;
          margin-top: 3rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #e0e0e0;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .stat-number {
          font-family: 'DM Mono', monospace;
          font-size: 1.4rem;
          font-weight: 400;
          color: #2c2c2c;
          line-height: 1;
        }

        .stat-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          font-weight: 300;
          color: #999;
        }

        .quick-links {
          display: flex;
          gap: 1.5rem;
          margin-top: 2.5rem;
        }

        .quick-link {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          font-weight: 400;
          letter-spacing: 0.04em;
          text-decoration: none;
          color: #999;
          transition: color 0.15s ease;
        }
        .quick-link:hover { color: #2c2c2c; }
        .quick-link.primary { color: #2c2c2c; }

        @media (max-width: 640px) {
          .stats-row { flex-wrap: wrap; gap: 2rem; }
          .hero h1 { font-size: 2.2rem; }
        }
      `}</style>

      <div className="hero">
        <h1>Athenaeum Deipnon</h1>
        <p>Cookbook Library</p>
      </div>

      <div className="stats-row">
        <div className="stat">
          <div className="stat-number">{stats.totalBooks ?? 0}</div>
          <div className="stat-label">books</div>
        </div>
        <div className="stat">
          <div className="stat-number">${Math.round(stats.totalValue ?? 0).toLocaleString()}</div>
          <div className="stat-label">est. value</div>
        </div>
        <div className="stat">
          <div className="stat-number">{stats.languages ?? 0}</div>
          <div className="stat-label">languages</div>
        </div>
        <div className="stat">
          <div className="stat-number">{stats.oldest ?? '—'}</div>
          <div className="stat-label">oldest</div>
        </div>
      </div>

      <div className="quick-links">
        <Link href="/collection" className="quick-link primary">Collection</Link>
        <Link href="/genre" className="quick-link">Genre</Link>
        <Link href="/collections" className="quick-link">Shelves</Link>
        <Link href="/add" className="quick-link">+ Add</Link>
      </div>
    </PageShell>
  )
}
