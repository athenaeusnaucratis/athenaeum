import { supabase } from '@/lib/supabase'
import BookList from '@/app/components/BookList'
import Link from 'next/link'

export default async function Home() {
  const { data: books, error } = await supabase
    .from('books')
    .select(`
      id,
      title,
      subtitle,
      publication_year,
      estimated_value_usd,
      language,
      authors:book_authors(
        authors(full_name)
      )
    `)
    .order('title')

  if (error) return <p style={{ padding: '2rem', color: 'red' }}>Error: {error.message}</p>

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Mono:wght@300;400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background-color: #f7f4ef;
          color: #1a1814;
        }

        .page {
          min-height: 100vh;
          padding: 0 2.5rem 4rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* ── HEADER ── */
        .header {
          padding: 3rem 0 2rem;
          border-bottom: 1px solid #d4cfc8;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1rem;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding-bottom: 0.25rem;
        }

        .add-link {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #f7f4ef;
          background: #1a1814;
          text-decoration: none;
          padding: 0.6rem 1.2rem;
          transition: background 0.15s ease;
        }
        .add-link:hover { background: #e8694a; }

        .header-left h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3.5rem;
          font-weight: 600;
          line-height: 1;
          letter-spacing: -0.02em;
          color: #1a1814;
        }

        .header-left p {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          font-weight: 300;
          color: #9c8e7e;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-top: 0.5rem;
        }

        .header-count {
          font-family: 'Cormorant Garamond', serif;
          font-size: 4.5rem;
          font-weight: 400;
          font-style: italic;
          color: #e8694a;
          line-height: 1;
        }

        /* ── TABLE ── */
        .table-wrap {
          margin-top: 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        thead tr {
          border-bottom: 1px solid #d4cfc8;
        }

        thead th {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          font-weight: 400;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #9c8e7e;
          padding: 1rem 1rem 0.75rem;
          text-align: left;
        }

        thead th:first-child { padding-left: 0; }
        thead th:last-child  { padding-right: 0; text-align: right; }

        tbody tr {
          border-bottom: 1px solid #e8e4de;
          transition: background 0.15s ease;
        }

        tbody tr:hover {
          background-color: #f0ebe3;
        }

        tbody td {
          padding: 1rem;
          vertical-align: top;
        }

        tbody td:first-child { padding-left: 0; }
        tbody td:last-child  { padding-right: 0; text-align: right; }

        .book-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.05rem;
          font-weight: 600;
          color: #1a1814;
          line-height: 1.3;
        }

        .book-subtitle {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.9rem;
          font-style: italic;
          color: #9c8e7e;
          display: block;
          margin-top: 0.1rem;
        }

        .book-author {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          color: #4a443c;
        }

        .book-year {
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          font-weight: 300;
          color: #6b6058;
        }

        .book-value {
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          font-weight: 400;
          color: #e8694a;
        }

        .book-value.empty {
          color: #c8c2ba;
        }

        /* ── SEARCH ── */
        .search-wrap {
          padding: 1.5rem 0 0;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .search-input {
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          font-weight: 300;
          color: #1a1814;
          background: transparent;
          border: none;
          border-bottom: 1px solid #d4cfc8;
          padding: 0.4rem 0;
          width: 320px;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .search-input::placeholder { color: #b8b0a6; }
        .search-input:focus { border-bottom-color: #e8694a; }
        .search-input::-webkit-search-cancel-button { display: none; }

        .search-count {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          font-weight: 300;
          color: #9c8e7e;
          letter-spacing: 0.08em;
        }

        .no-results td {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          color: #9c8e7e;
          padding: 2rem 0;
        }

        /* ── COL WIDTHS ── */
        .col-title  { width: 45%; }
        .col-author { width: 30%; }
        .col-year   { width: 10%; }
        .col-value  { width: 15%; }
      `}</style>

      <div className="page">
        <header className="header">
          <div className="header-left">
            <h1>Athenaeum</h1>
            <p>Cookbook Library · Personal Collection</p>
          </div>
          <div className="header-actions">
            <Link href="/add" className="add-link">+ Add Book</Link>
            <span className="header-count">{books.length}</span>
          </div>
        </header>

        <BookList books={books} />
      </div>
    </>
  )
}
