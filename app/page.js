import { getCollectionStats, getRecentBooks } from '@/lib/books'
import PageShell from '@/app/components/PageShell'
import Link from 'next/link'
import { getSession } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const user = await getSession()
  const stats = await getCollectionStats()
  const { data: recentBooks } = await getRecentBooks(5)

  const coverColors = ['#2a2720', '#202620', '#28201e', '#1e2228', '#252320']

  return (
    <PageShell active="/">
      <style>{`
        /* ── HERO ── */
        .hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: calc(100vh - 64px);
          border-bottom: 1px solid var(--rule);
        }

        .hero-left {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 6rem 4rem 6rem 5rem;
          border-right: 1px solid var(--rule);
          animation: fadeUp 0.9s 0.2s ease both;
        }

        .hero-eyebrow {
          font-family: var(--mono);
          font-size: 0.65rem;
          font-weight: 400;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--coral);
          margin-bottom: 2rem;
        }

        .hero-title {
          font-family: var(--serif);
          font-size: clamp(3.5rem, 7vw, 6rem);
          font-weight: 300;
          line-height: 1.0;
          letter-spacing: -0.01em;
          color: var(--ink);
          margin-bottom: 0.4rem;
        }
        .hero-title em { font-style: italic; color: var(--coral); }

        .hero-subtitle {
          font-family: var(--serif);
          font-size: clamp(1.2rem, 2.5vw, 1.8rem);
          font-weight: 300;
          font-style: italic;
          color: var(--muted);
          margin-bottom: 3.5rem;
          letter-spacing: 0.02em;
        }

        .hero-rule {
          width: 48px;
          height: 1px;
          background: var(--coral);
          margin-bottom: 2rem;
        }

        .hero-desc {
          font-family: var(--sans);
          font-size: 0.8rem;
          font-weight: 300;
          line-height: 1.9;
          color: var(--muted);
          max-width: 34ch;
          letter-spacing: 0.03em;
        }

        .hero-actions {
          display: flex;
          gap: 1.2rem;
          margin-top: 3.5rem;
          align-items: center;
        }

        .btn-primary {
          font-family: var(--sans);
          font-size: 0.72rem;
          font-weight: 400;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-decoration: none;
          color: var(--parchment);
          background: var(--ink);
          padding: 0.85rem 2rem;
          transition: background 0.2s;
        }
        .btn-primary:hover { background: var(--coral); }

        .btn-ghost {
          font-family: var(--sans);
          font-size: 0.72rem;
          font-weight: 300;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          color: var(--muted);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: color 0.2s;
        }
        .btn-ghost:hover { color: var(--ink); }
        .btn-ghost::after { content: '→'; font-family: var(--serif); }

        /* ── STATS GRID ── */
        .hero-right {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          animation: fadeUp 0.9s 0.35s ease both;
        }

        .stat-cell {
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 3.5rem;
          border-bottom: 1px solid var(--rule);
          position: relative;
          transition: background 0.25s;
          cursor: default;
        }
        .stat-cell:nth-child(1) { border-right: 1px solid var(--rule); }
        .stat-cell:nth-child(3) { border-right: 1px solid var(--rule); border-bottom: none; }
        .stat-cell:nth-child(4) { border-bottom: none; }
        .stat-cell:hover { background: var(--warm-mid); }
        .stat-cell::before {
          content: attr(data-index);
          position: absolute;
          top: 2.2rem;
          left: 3.5rem;
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          color: var(--rule);
        }

        .stat-value {
          font-family: var(--serif);
          font-size: clamp(2.8rem, 5vw, 4.5rem);
          font-weight: 300;
          line-height: 1;
          color: var(--ink);
          margin-bottom: 0.6rem;
        }
        .stat-value .accent { color: var(--coral); }

        .stat-label {
          font-family: var(--sans);
          font-size: 0.65rem;
          font-weight: 300;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--muted);
        }

        /* ── QUICK NAV BAND ── */
        .band {
          display: flex;
          align-items: center;
          border-bottom: 1px solid var(--rule);
          overflow: hidden;
          animation: fadeUp 0.9s 0.5s ease both;
        }

        .band-item {
          flex: 1;
          padding: 2.2rem 3rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          border-right: 1px solid var(--rule);
          text-decoration: none;
          color: var(--ink);
          transition: background 0.2s;
        }
        .band-item:last-child { border-right: none; }
        .band-item:hover { background: var(--warm-mid); }

        .band-icon {
          font-family: var(--serif);
          font-size: 1.4rem;
          font-style: italic;
          color: var(--coral);
          min-width: 2rem;
          text-align: center;
        }

        .band-text-title {
          font-family: var(--sans);
          font-size: 0.7rem;
          font-weight: 400;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink);
          margin-bottom: 0.2rem;
        }

        .band-text-sub {
          font-family: var(--mono);
          font-size: 0.62rem;
          color: var(--muted);
          letter-spacing: 0.05em;
        }

        .band-arrow {
          margin-left: auto;
          font-family: var(--serif);
          font-size: 1.2rem;
          color: var(--rule);
          transition: color 0.2s, transform 0.2s;
        }
        .band-item:hover .band-arrow {
          color: var(--coral);
          transform: translateX(4px);
        }

        /* ── RECENT BOOKS ── */
        .section-recent {
          display: grid;
          grid-template-columns: 320px 1fr;
          border-bottom: 1px solid var(--rule);
          animation: fadeUp 0.9s 0.65s ease both;
        }

        .section-label-col {
          padding: 3.5rem;
          border-right: 1px solid var(--rule);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .section-label-text {
          font-family: var(--serif);
          font-size: 1.8rem;
          font-weight: 300;
          font-style: italic;
          color: var(--ink);
          line-height: 1.2;
        }

        .section-label-meta {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.12em;
          color: var(--muted);
          margin-top: 1.5rem;
        }

        .view-all {
          font-family: var(--sans);
          font-size: 0.65rem;
          font-weight: 300;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--coral);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .view-all::after { content: '→'; font-family: var(--serif); }

        .recent-books {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
        }

        .book-card {
          padding: 2.5rem 2rem;
          border-right: 1px solid var(--rule);
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          text-decoration: none;
          color: inherit;
        }
        .book-card:last-child { border-right: none; }
        .book-card:hover { background: var(--warm-mid); }

        .book-cover {
          width: 100%;
          aspect-ratio: 2/3;
          border: 1px solid var(--rule);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .book-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .book-cover-inner {
          width: calc(100% - 16px);
          height: calc(100% - 16px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          text-align: center;
        }

        .book-cover-title {
          font-family: var(--serif);
          font-size: 0.75rem;
          font-weight: 400;
          font-style: italic;
          color: var(--muted);
          line-height: 1.4;
        }

        .book-meta-title {
          font-family: var(--serif);
          font-size: 0.82rem;
          font-weight: 400;
          color: var(--ink);
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .book-meta-author {
          font-family: var(--mono);
          font-size: 0.6rem;
          color: var(--muted);
          letter-spacing: 0.06em;
          margin-top: -0.5rem;
        }

        .book-meta-value {
          font-family: var(--mono);
          font-size: 0.65rem;
          color: var(--coral);
          letter-spacing: 0.08em;
          margin-top: auto;
        }

        /* ── FOOTER ── */
        .home-footer {
          padding: 2rem 5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          animation: fadeUp 0.9s 0.75s ease both;
        }

        .footer-brand {
          font-family: var(--serif);
          font-size: 0.85rem;
          font-style: italic;
          color: var(--muted);
        }

        .footer-note {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.12em;
          color: var(--rule);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .hero { grid-template-columns: 1fr; min-height: auto; }
          .hero-left { padding: 4rem 2rem; border-right: none; border-bottom: 1px solid var(--rule); }
          .hero-right { grid-template-columns: 1fr 1fr; }
          .band { flex-wrap: wrap; }
          .band-item { flex: 1 1 50%; }
          .band-item:nth-child(2) { border-right: none; }
          .section-recent { grid-template-columns: 1fr; }
          .section-label-col { border-right: none; border-bottom: 1px solid var(--rule); padding: 2rem 2rem; flex-direction: row; align-items: center; }
          .recent-books { grid-template-columns: repeat(3, 1fr); }
        }

        @media (max-width: 640px) {
          .hero-left { padding: 3rem 1.25rem; }
          .stat-cell { padding: 2rem; }
          .stat-cell::before { top: 1.2rem; left: 2rem; }
          .band-item { padding: 1.5rem 1.25rem; flex: 1 1 100%; border-right: none; border-bottom: 1px solid var(--rule); }
          .band-item:last-child { border-bottom: none; }
          .recent-books { grid-template-columns: repeat(2, 1fr); }
          .book-card:nth-child(n+5) { display: none; }
          .home-footer { padding: 2rem 1.25rem; flex-direction: column; gap: 0.5rem; }
        }
      `}</style>

      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <p className="hero-eyebrow">Personal Cookbook Library</p>
          <h1 className="hero-title">Athenaeum<br /><em>Deipnon</em></h1>
          <p className="hero-subtitle">A library of culinary arts</p>
          <div className="hero-rule"></div>
          <p className="hero-desc">
            A personal archive of culinary knowledge — spanning centuries of tradition,
            technique, and taste.
          </p>
          <div className="hero-actions">
            <Link href="/collection" className="btn-primary">Browse Collection</Link>
            <Link href="/collection" className="btn-ghost">Recent additions</Link>
          </div>
        </div>

        <div className="hero-right">
          <div className="stat-cell" data-index="01">
            <div className="stat-value">{stats.totalBooks ?? 0}</div>
            <div className="stat-label">Books in collection</div>
          </div>
          {user ? (
            <div className="stat-cell" data-index="02">
              <div className="stat-value"><span className="accent">$</span>{Math.round(stats.totalValue ?? 0).toLocaleString()}</div>
              <div className="stat-label">Estimated value</div>
            </div>
          ) : (
            <div className="stat-cell" data-index="02">
              <div className="stat-value">{stats.chefs ?? 0}</div>
              <div className="stat-label">Chefs</div>
            </div>
          )}
          <div className="stat-cell" data-index="03">
            <div className="stat-value">{stats.languages ?? 0}</div>
            <div className="stat-label">Languages</div>
          </div>
          <div className="stat-cell" data-index="04">
            <div className="stat-value">{stats.oldest ?? '—'}</div>
            <div className="stat-label">Oldest volume</div>
          </div>
        </div>
      </section>

      {/* QUICK NAV BAND */}
      <section className="band">
        <Link href="/authors" className="band-item">
          <div className="band-icon">A</div>
          <div>
            <div className="band-text-title">Authors</div>
            <div className="band-text-sub">Browse by contributor</div>
          </div>
          <span className="band-arrow">→</span>
        </Link>
        <Link href="/genre" className="band-item">
          <div className="band-icon">§</div>
          <div>
            <div className="band-text-title">Categories</div>
            <div className="band-text-sub">Cuisines & techniques</div>
          </div>
          <span className="band-arrow">→</span>
        </Link>
        <Link href="/collections" className="band-item">
          <div className="band-icon">◎</div>
          <div>
            <div className="band-text-title">Collections</div>
            <div className="band-text-sub">Curated groupings</div>
          </div>
          <span className="band-arrow">→</span>
        </Link>
        <Link href="/collection" className="band-item">
          <div className="band-icon">¥</div>
          <div>
            <div className="band-text-title">By Language</div>
            <div className="band-text-sub">{stats.languages ?? 0} languages archived</div>
          </div>
          <span className="band-arrow">→</span>
        </Link>
      </section>

      {/* RECENT BOOKS */}
      <section className="section-recent">
        <div className="section-label-col">
          <div>
            <div className="section-label-text">Recently<br />added</div>
            <div className="section-label-meta">Last updated — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
          </div>
          <Link href="/collection" className="view-all">View all books</Link>
        </div>

        <div className="recent-books">
          {(recentBooks || []).map((book, i) => {
            const author = book.authors?.[0]?.authors?.full_name
            const val = book.estimated_value_usd
            return (
              <Link key={book.id} href={`/books/${book.id}`} className="book-card">
                <div className="book-cover" style={{ background: coverColors[i % coverColors.length] }}>
                  {book.cover_image_url ? (
                    <img src={book.cover_image_url} alt={book.title} />
                  ) : (
                    <div className="book-cover-inner">
                      <span className="book-cover-title">{book.title}</span>
                    </div>
                  )}
                </div>
                <div className="book-meta-title">{book.title}</div>
                {author && <div className="book-meta-author">{author}</div>}
                {val && <div className="book-meta-value">${Number(val).toFixed(2)}</div>}
              </Link>
            )
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <span className="footer-brand">Athenaeum Deipnon</span>
        <span className="footer-note">
          {stats.totalBooks ?? 0} volumes
          {user && ` · est. value $${Math.round(stats.totalValue ?? 0).toLocaleString()}`}
          {` · since ${stats.oldest ?? '—'}`}
        </span>
      </footer>
    </PageShell>
  )
}
