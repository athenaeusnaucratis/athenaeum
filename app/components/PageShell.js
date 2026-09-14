import Nav from './Nav'
import { getSession } from '@/lib/supabase-server'

export default async function PageShell({ active, children }) {
  const user = await getSession()
  return (
    <>
      <style>{`
        /* ── NAV ── */
        .nav-bar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 3rem;
          height: 64px;
          border-bottom: 1px solid var(--rule);
          background: rgba(17, 16, 9, 0.92);
          backdrop-filter: blur(12px);
        }

        .nav-logo {
          font-family: var(--serif);
          font-size: 1.05rem;
          font-weight: 400;
          letter-spacing: 0.06em;
          color: var(--ink);
          text-decoration: none;
        }
        .nav-logo em { font-style: italic; font-weight: 300; color: var(--coral); }

        .nav-links {
          display: flex;
          gap: 2.5rem;
          list-style: none;
        }

        .nav-link {
          font-family: var(--sans);
          font-size: 0.7rem;
          font-weight: 300;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--muted);
          text-decoration: none;
          transition: color 0.2s;
        }
        .nav-link:hover { color: var(--ink); }
        .nav-link.active { color: var(--coral); }

        .nav-add {
          font-family: var(--mono);
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          color: var(--coral);
          text-decoration: none;
          border: 1px solid var(--coral);
          padding: 0.4rem 1rem;
          transition: background 0.2s, color 0.2s;
        }
        .nav-add:hover { background: var(--coral); color: var(--parchment); }

        /* ── PAGE SHELL ── */
        .page {
          padding-top: 64px;
          min-height: 100vh;
        }

        /* ── PAGE HEADER ── */
        .page-header {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: end;
          padding: 3.5rem 5rem 2.5rem;
          border-bottom: 1px solid var(--rule);
          animation: fadeUp 0.6s 0.1s ease both;
        }

        .page-eyebrow {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--coral);
          margin-bottom: 0.8rem;
        }

        .page-title {
          font-family: var(--serif);
          font-size: 2.6rem;
          font-weight: 400;
          line-height: 1.1;
          color: var(--ink);
        }

        .page-subtitle {
          font-family: var(--sans);
          font-size: 0.78rem;
          font-weight: 200;
          color: var(--muted);
          margin-top: 0.6rem;
        }

        .page-header-stat {
          font-family: var(--mono);
          font-size: 2.4rem;
          font-weight: 300;
          color: var(--ink);
          line-height: 1;
        }

        .page-header-stat-label {
          font-family: var(--mono);
          font-size: 0.58rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--muted);
          margin-top: 0.3rem;
          text-align: right;
        }

        /* ── SHARED TYPOGRAPHY ── */
        .section-title {
          font-family: var(--serif);
          font-size: 1.4rem;
          font-weight: 500;
          color: var(--ink);
          margin-top: 3rem;
          margin-bottom: 1rem;
        }

        .section-label {
          font-family: var(--mono);
          font-size: 0.6rem;
          font-weight: 400;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--muted);
          margin-top: 2.5rem;
          margin-bottom: 1rem;
        }

        .accent { color: var(--coral); }
        .mono {
          font-family: var(--mono);
          font-size: 0.75rem;
          font-weight: 300;
        }

        /* ── CONTENT AREA ── */
        .page-content {
          padding: 0 5rem 5rem;
        }

        @media (max-width: 768px) {
          .nav-bar { padding: 0 1rem; gap: 0.7rem; }
          .nav-links { gap: 1rem; }
          .page-header { padding: 2.5rem 1.25rem 2rem; }
          .page-content { padding: 0 1.25rem 3rem; }
          .page-title { font-size: 2rem; }
          /* Keep +ADD visible on mobile, but tighter */
          .nav-add { padding: 0.35rem 0.7rem; font-size: 0.62rem; letter-spacing: 0.06em; }
        }
      `}</style>

      <div className="page">
        <Nav active={active} user={user} />
        {children}
      </div>
    </>
  )
}
