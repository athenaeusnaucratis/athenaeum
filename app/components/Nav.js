import Link from 'next/link'

export default function Nav({ active, user }) {
  const links = [
    { href: '/', label: 'Home' },
    { href: '/collection', label: 'Books' },
    { href: '/authors', label: 'Authors' },
    { href: '/chefs', label: 'Chefs' },
    { href: '/genre', label: 'Category' },
    { href: '/language', label: 'Language' },
    { href: '/location', label: 'Location' },
    { href: '/collections', label: 'Collections' },
  ]

  return (
    <nav className="nav-bar">
      <Link href="/" className="nav-logo">
        Athenaeum <em>Deipnon</em>
      </Link>
      <div className="nav-links">
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`nav-link${active === l.href ? ' active' : ''}`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      {user ? (
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <Link href="/add" className="nav-add">+ ADD</Link>
          <form action="/auth/signout" method="post" style={{ display: 'inline' }}>
            <button type="submit" className="nav-link" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}>
              Sign out
            </button>
          </form>
        </div>
      ) : (
        <Link href="/login" className="nav-link">Sign in</Link>
      )}
    </nav>
  )
}
