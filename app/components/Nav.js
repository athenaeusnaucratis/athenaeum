import Link from 'next/link'

export default function Nav({ active }) {
  const links = [
    { href: '/', label: 'Home' },
    { href: '/collection', label: 'Collection' },
    { href: '/authors', label: 'Authors' },
    { href: '/genre', label: 'Category' },
    { href: '/add', label: '+ Add' },
  ]

  return (
    <nav className="nav">
      {links.map(l => (
        <Link
          key={l.href}
          href={l.href}
          className={`nav-link${active === l.href ? ' active' : ''}`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  )
}
