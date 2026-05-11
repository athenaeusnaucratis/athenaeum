import Nav from './Nav'

export default function PageShell({ active, children }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Mono:wght@300;400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background-color: #ffffff; color: #2c2c2c; }

        .page {
          min-height: 100vh;
          padding: 0 3rem 5rem;
          max-width: 960px;
          margin: 0 auto;
        }

        /* ── NAV ── */
        .nav {
          display: flex;
          align-items: center;
          gap: 2.5rem;
          padding: 1.25rem 0;
          border-bottom: 1px solid #e0e0e0;
        }

        .nav-link {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          font-weight: 400;
          letter-spacing: 0.08em;
          color: #999;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .nav-link:hover { color: #2c2c2c; }
        .nav-link.active { color: #2c2c2c; }

        /* ── SHARED TYPOGRAPHY ── */
        .page-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          font-weight: 500;
          line-height: 1.2;
          color: #2c2c2c;
          margin-top: 2.5rem;
        }

        .page-subtitle {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          font-weight: 300;
          color: #999;
          letter-spacing: 0.06em;
          margin-top: 0.4rem;
        }

        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.4rem;
          font-weight: 500;
          color: #2c2c2c;
          margin-top: 3rem;
          margin-bottom: 1rem;
        }

        .section-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #999;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
        }

        .accent { color: #c45a3c; }
        .mono {
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          font-weight: 300;
        }

        @media (max-width: 640px) {
          .page { padding: 0 1.25rem 3rem; }
          .nav { gap: 1.5rem; }
        }
      `}</style>

      <div className="page">
        <Nav active={active} />
        {children}
      </div>
    </>
  )
}
