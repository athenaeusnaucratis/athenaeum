import { supabase } from '@/lib/supabase'
import PageShell from '@/app/components/PageShell'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function LanguageDetailPage({ params }) {
  const { lang } = await params
  const language = decodeURIComponent(lang)

  const { data: books } = await supabase
    .from('books')
    .select('id, title, estimated_value_usd, cover_image_url, authors:book_authors(authors(id, full_name))')
    .eq('language', language)
    .order('title')

  if (!books || books.length === 0) return notFound()

  return (
    <PageShell active="/language">
      <style>{`
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 1.4rem 5rem;
          border-bottom: 1px solid var(--rule);
          animation: fadeUp 0.5s 0.05s ease both;
        }
        .breadcrumb a, .breadcrumb span {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
        }
        .breadcrumb a { color: var(--muted); transition: color 0.15s; }
        .breadcrumb a:hover { color: var(--ink); }
        .breadcrumb .sep { color: var(--rule); }
        .breadcrumb span.current { color: var(--coral); }

        .lang-detail-header {
          padding: 3.5rem 5rem 3rem;
          border-bottom: 1px solid var(--rule);
          animation: fadeUp 0.6s 0.1s ease both;
        }
        .lang-eyebrow {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--coral);
          margin-bottom: 0.8rem;
        }
        .lang-name-title {
          font-family: var(--serif);
          font-size: clamp(2rem, 4vw, 3.5rem);
          font-weight: 300;
          font-style: italic;
          line-height: 1.1;
          color: var(--ink);
        }
        .lang-book-count {
          font-family: var(--mono);
          font-size: 0.65rem;
          color: var(--muted);
          letter-spacing: 0.1em;
          margin-top: 0.8rem;
        }

        .lang-book-row {
          display: grid;
          grid-template-columns: 1fr auto auto;
          align-items: center;
          padding: 1.2rem 5rem;
          border-bottom: 1px solid var(--rule);
          text-decoration: none;
          color: inherit;
          transition: background 0.15s;
          animation: fadeUp 0.5s 0.15s ease both;
        }
        .lang-book-row:hover { background: var(--warm-mid); }

        .lb-title {
          font-family: var(--serif);
          font-size: 1.05rem;
          font-weight: 400;
          color: var(--ink);
          transition: color 0.15s;
        }
        .lang-book-row:hover .lb-title { color: var(--coral); }

        .lb-author {
          font-family: var(--mono);
          font-size: 0.65rem;
          color: var(--muted);
          letter-spacing: 0.04em;
          padding: 0 2rem;
        }

        .lb-value {
          font-family: var(--mono);
          font-size: 0.7rem;
          color: var(--coral);
          letter-spacing: 0.06em;
        }
        .lb-value.none { color: var(--muted); }

        @media (max-width: 768px) {
          .breadcrumb { padding: 1rem 1.25rem; }
          .lang-detail-header { padding: 2rem 1.25rem; }
          .lang-book-row { padding: 1rem 1.25rem; grid-template-columns: 1fr auto; }
          .lb-author { display: none; }
        }
      `}</style>

      <div className="breadcrumb">
        <Link href="/language">Language</Link>
        <span className="sep">/</span>
        <span className="current">{language}</span>
      </div>

      <div className="lang-detail-header">
        <div className="lang-eyebrow">Language</div>
        <h1 className="lang-name-title">{language}</h1>
        <div className="lang-book-count">{books.length} book{books.length !== 1 ? 's' : ''}</div>
      </div>

      {books.map(book => (
        <Link key={book.id} href={`/books/${book.id}`} className="lang-book-row">
          <div className="lb-title">{book.title}</div>
          <span className="lb-author">
            {book.authors?.[0]?.authors?.full_name ?? '—'}
          </span>
          <span className={`lb-value${book.estimated_value_usd ? '' : ' none'}`}>
            {book.estimated_value_usd ? `$${Number(book.estimated_value_usd).toFixed(2)}` : '—'}
          </span>
        </Link>
      ))}
    </PageShell>
  )
}
