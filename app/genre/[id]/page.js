import { getClassById, getBooksByClass } from '@/lib/books'
import { supabase } from '@/lib/supabase'
import PageShell from '@/app/components/PageShell'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ClassDetailPage({ params }) {
  const { id } = await params
  const { data: cls } = await getClassById(id)
  if (!cls) return notFound()

  // Walk up the tree for a breadcrumb
  const { data: all } = await supabase.from('classes').select('id, notation, name, level, parent_id')
  const byId = Object.fromEntries((all || []).map(c => [c.id, c]))
  const trail = []
  let cur = cls
  while (cur) {
    trail.unshift(cur)
    cur = cur.parent_id ? byId[cur.parent_id] : null
  }

  const { data: books } = await getBooksByClass(id, { includeDescendants: true })
  const isLeaf = cls.level === 'subcategory'

  return (
    <PageShell active="/genre">
      <style>{`
        .cd-crumb { padding: 1.4rem 5rem; border-bottom: 1px solid var(--rule); display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
        .cd-crumb a, .cd-crumb span { font-family: var(--mono); font-size: 0.62rem; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; }
        .cd-crumb a { color: var(--muted); transition: color 0.15s; }
        .cd-crumb a:hover { color: var(--ink); }
        .cd-crumb .sep { color: var(--rule); }
        .cd-crumb .current { color: var(--coral); }

        .cd-header { padding: 3rem 5rem 2.5rem; border-bottom: 1px solid var(--rule); animation: fadeUp 0.5s ease both; }
        .cd-notation { font-family: var(--mono); font-size: 0.65rem; letter-spacing: 0.14em; color: var(--coral); margin-bottom: 0.6rem; }
        .cd-title { font-family: var(--serif); font-size: clamp(2rem, 4vw, 3.4rem); font-weight: 300; font-style: italic; line-height: 1.05; color: var(--ink); }
        .cd-level { font-family: var(--mono); font-size: 0.58rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-top: 0.6rem; }
        .cd-desc { font-family: var(--serif); font-size: 1rem; font-style: italic; color: var(--muted); line-height: 1.55; margin-top: 1rem; max-width: 68ch; }
        .cd-count { font-family: var(--mono); font-size: 0.65rem; color: var(--muted); letter-spacing: 0.08em; margin-top: 1.2rem; }
        .cd-count b { color: var(--ink); font-weight: 500; }

        .cd-book-row {
          display: grid; grid-template-columns: 1fr auto auto;
          align-items: center; padding: 1.15rem 5rem;
          border-bottom: 1px solid var(--rule);
          text-decoration: none; color: inherit;
          transition: background 0.15s;
        }
        .cd-book-row:hover { background: var(--warm-mid); }
        .cd-book-title { font-family: var(--serif); font-size: 1.05rem; color: var(--ink); transition: color 0.15s; }
        .cd-book-row:hover .cd-book-title { color: var(--coral); }
        .cd-book-author { font-family: var(--mono); font-size: 0.65rem; color: var(--muted); letter-spacing: 0.04em; padding: 0 2rem; }
        .cd-book-value { font-family: var(--mono); font-size: 0.7rem; color: var(--coral); letter-spacing: 0.06em; }
        .cd-book-value.none { color: var(--muted); }

        .cd-empty { font-family: var(--serif); font-size: 1rem; font-style: italic; color: var(--muted); padding: 3rem 5rem; }

        @media (max-width: 768px) {
          .cd-crumb, .cd-header, .cd-empty { padding-left: 1.25rem; padding-right: 1.25rem; }
          .cd-book-row { padding: 1rem 1.25rem; grid-template-columns: 1fr auto; }
          .cd-book-author { display: none; }
        }
      `}</style>

      <div className="cd-crumb">
        <Link href="/genre">Classification</Link>
        {trail.slice(1, -1).map(t => (
          <span key={t.id} style={{ display: 'contents' }}>
            <span className="sep">/</span>
            <Link href={`/genre/${t.id}`}>{t.name}</Link>
          </span>
        ))}
        {trail.length > 1 && <span className="sep">/</span>}
        <span className="current">{cls.name}</span>
      </div>

      <div className="cd-header">
        <div className="cd-notation">{cls.notation}</div>
        <h1 className="cd-title">{cls.name}</h1>
        <div className="cd-level">{cls.level}</div>
        {cls.description && <p className="cd-desc">{cls.description}</p>}
        <div className="cd-count">
          <b>{books?.length ?? 0}</b> book{(books?.length ?? 0) === 1 ? '' : 's'}
          {!isLeaf && (books?.length ?? 0) > 0 && ' (including subcategories)'}
        </div>
      </div>

      {books?.length > 0 ? (
        books.map(book => (
          <Link key={book.id} href={`/books/${book.id}`} className="cd-book-row">
            <div className="cd-book-title">{book.title}</div>
            <span className="cd-book-author">
              {book.authors?.[0]?.authors?.full_name ?? '—'}
            </span>
            <span className={`cd-book-value${book.estimated_value_usd ? '' : ' none'}`}>
              {book.estimated_value_usd ? `$${Number(book.estimated_value_usd).toFixed(2)}` : '—'}
            </span>
          </Link>
        ))
      ) : (
        <p className="cd-empty">No books classified under &ldquo;{cls.name}&rdquo; yet.</p>
      )}
    </PageShell>
  )
}
