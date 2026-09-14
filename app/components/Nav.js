import Link from 'next/link'

export default function Nav({ active, user }) {
  const publicLinks = [
    { href: '/', label: 'Home' },
    { href: '/collection', label: 'Books' },
    { href: '/authors', label: 'Authors' },
    { href: '/chefs', label: 'Chefs' },
    { href: '/publishers', label: 'Publishers' },
    { href: '/genre', label: 'Category' },
    { href: '/language', label: 'Language' },
    { href: '/collections', label: 'Collections' },
  ]
  const adminLink = { href: '/admin', label: 'Admin' }
  const links = user ? [...publicLinks, adminLink] : publicLinks

  return (
    <nav className="nav-bar">
      <Link href="/" className="nav-logo">
        Athenaeum <em>Deipnon</em>
      </Link>
      {user && <Link href="/add" className="nav-add">+ ADD</Link>}
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
        <form action="/auth/signout" method="post" style={{ display: 'inline' }}>
          <button type="submit" className="nav-link" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}>
            Sign out
          </button>
        </form>
      ) : (
        <Link href="/login" className="nav-link">Sign in</Link>
      )}
    </nav>
  )
}
