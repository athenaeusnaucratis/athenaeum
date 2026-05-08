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
          border-bottom: 1px solid #d4cfc8;
        }

        .hero h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 5rem;
          font-weight: 600;
          line-height: 1;
          letter-spacing: -0.03em;
          color: #1a1814;
        }

        .hero p {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          font-weight: 300;
          color: #9c8e7e;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-top: 0.75rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          margin-top: 3rem;
        }

        .stat-card {
          padding: 1.5rem 0;
          border-top: 1px solid #d4cfc8;
        }

        .stat-number {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3rem;
          font-weight: 400;
          font-style: italic;
          color: #e8694a;
          line-height: 1;
        }

        .stat-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          font-weight: 400;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #9c8e7e;
          margin-top: 0.5rem;
        }

        .quick-links {
          display: flex;
          gap: 1rem;
          margin-top: 3rem;
          flex-wrap: wrap;
        }

        .quick-link {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          padding: 0.75rem 1.5rem;
          transition: all 0.15s ease;
        }

        .quick-link.primary {
          color: #f7f4ef;
          background: #1a1814;
        }
        .quick-link.primary:hover { background: #e8694a; }

        .quick-link.secondary {
          color: #1a1814;
          border: 1px solid #d4cfc8;
        }
        .quick-link.secondary:hover { border-color: #1a1814; }

        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .hero h1 { font-size: 3.5rem; }
        }
      `}</style>

      <div className="hero">
        <h1>Athenaeum Deipnon</h1>
        <p>Cookbook Library · Personal Collection</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.totalBooks ?? 0}</div>
          <div className="stat-label">Books</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">${Math.round(stats.totalValue ?? 0).toLocaleString()}</div>
          <div className="stat-label">Est. Value</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.languages ?? 0}</div>
          <div className="stat-label">Languages</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.oldest ?? '—'}</div>
          <div className="stat-label">Oldest</div>
        </div>
      </div>

      <div className="quick-links">
        <Link href="/collection" className="quick-link primary">Browse Collection</Link>
        <Link href="/genre" className="quick-link secondary">By Genre</Link>
        <Link href="/add" className="quick-link secondary">+ Add Book</Link>
      </div>
    </PageShell>
  )
}
