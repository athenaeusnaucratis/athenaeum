import Link from 'next/link'

export default function Nav({ active }) {
  const links = [
    { href: '/', label: 'Home' },
    { href: '/collection', label: 'Books' },
    { href: '/authors', label: 'Authors' },
    { href: '/genre', label: 'Category' },
    { href: '/collections', label: 'Collections' },
  ]

  return (
    <nav className="nav-bar">
      <Link href="/" className="nav-logo">
        Athenaeum <em>Deipnon</em><span>.</span>
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
      <Link href="/add" className="nav-add">+ ADD</Link>
    </nav>
  )
}
