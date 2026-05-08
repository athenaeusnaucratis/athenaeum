import Nav from './Nav'

export default function PageShell({ active, children }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Mono:wght@300;400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background-color: #f7f4ef; color: #1a1814; }

        .page {
          min-height: 100vh;
          padding: 0 2.5rem 4rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* ── NAV ── */
        .nav {
          display: flex;
          gap: 2rem;
          padding: 1.5rem 0;
          border-bottom: 1px solid #d4cfc8;
        }

        .nav-link {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          font-weight: 300;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #9c8e7e;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .nav-link:hover { color: #1a1814; }
        .nav-link.active { color: #e8694a; }

        /* ── SHARED TYPOGRAPHY ── */
        .page-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3.5rem;
          font-weight: 600;
          line-height: 1;
          letter-spacing: -0.02em;
          color: #1a1814;
          margin-top: 2rem;
        }

        .page-subtitle {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          font-weight: 300;
          color: #9c8e7e;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-top: 0.5rem;
        }

        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.8rem;
          font-weight: 600;
          color: #1a1814;
          margin-top: 3rem;
          margin-bottom: 1rem;
        }

        .section-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          font-weight: 400;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #9c8e7e;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
        }

        .accent { color: #e8694a; }
        .mono {
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          font-weight: 300;
        }
      `}</style>

      <div className="page">
        <Nav active={active} />
        {children}
      </div>
    </>
  )
}
