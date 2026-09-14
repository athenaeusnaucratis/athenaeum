import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <style>{`
        .site-footer {
          border-top: 1px solid var(--rule);
          padding: 1.5rem 3rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .site-footer a { color: var(--muted); text-decoration: none; transition: color 0.15s; }
        .site-footer a:hover { color: var(--coral); }
        .footer-left { display: flex; gap: 1.6rem; align-items: center; flex-wrap: wrap; }
        .footer-brand { font-family: var(--serif); font-size: 0.85rem; font-style: italic; text-transform: none; letter-spacing: 0.02em; color: var(--ink); }
        .footer-brand em { color: var(--coral); font-style: italic; }
        @media (max-width: 640px) {
          .site-footer { padding: 1.25rem 1.25rem; flex-direction: column; align-items: flex-start; gap: 0.75rem; }
        }
      `}</style>
      <div className="footer-left">
        <span className="footer-brand">Athenaeum <em>Deipnon</em></span>
        <Link href="/about">About</Link>
        <Link href="/about#contact">Contact</Link>
        <Link href="/about#terms">Terms</Link>
      </div>
      <div>© {year}</div>
    </footer>
  )
}
