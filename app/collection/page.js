import { supabase } from '@/lib/supabase'
import BookList from '@/app/components/BookList'
import PageShell from '@/app/components/PageShell'

export default async function CollectionPage() {
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
    <PageShell active="/collection">
      <style>{`
        .collection-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-top: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #d4cfc8;
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
        .table-wrap { margin-top: 0; }

        table { width: 100%; border-collapse: collapse; }
        thead tr { border-bottom: 1px solid #d4cfc8; }

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
        tbody tr:hover { background-color: #f0ebe3; }

        tbody td { padding: 1rem; vertical-align: top; }
        tbody td:first-child { padding-left: 0; }
        tbody td:last-child  { padding-right: 0; text-align: right; }

        .book-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.05rem; font-weight: 600; color: #1a1814; line-height: 1.3;
        }
        .book-subtitle {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.9rem; font-style: italic; color: #9c8e7e;
          display: block; margin-top: 0.1rem;
        }
        .book-author { font-family: 'Cormorant Garamond', serif; font-size: 1rem; color: #4a443c; }
        .book-year { font-family: 'DM Mono', monospace; font-size: 0.75rem; font-weight: 300; color: #6b6058; }
        .book-value { font-family: 'DM Mono', monospace; font-size: 0.75rem; font-weight: 400; color: #e8694a; }
        .book-value.empty { color: #c8c2ba; }

        /* ── SEARCH ── */
        .search-wrap { padding: 1.5rem 0 0; display: flex; align-items: center; gap: 1rem; }
        .search-input {
          font-family: 'DM Mono', monospace; font-size: 0.75rem; font-weight: 300;
          color: #1a1814; background: transparent; border: none;
          border-bottom: 1px solid #d4cfc8; padding: 0.4rem 0; width: 320px;
          outline: none; transition: border-color 0.15s ease;
        }
        .search-input::placeholder { color: #b8b0a6; }
        .search-input:focus { border-bottom-color: #e8694a; }
        .search-input::-webkit-search-cancel-button { display: none; }
        .search-count {
          font-family: 'DM Mono', monospace; font-size: 0.65rem; font-weight: 300;
          color: #9c8e7e; letter-spacing: 0.08em;
        }
        .no-results td {
          font-family: 'Cormorant Garamond', serif; font-style: italic;
          color: #9c8e7e; padding: 2rem 0;
        }

        .col-title  { width: 45%; }
        .col-author { width: 30%; }
        .col-year   { width: 10%; }
        .col-value  { width: 15%; }
      `}</style>

      <div className="collection-header">
        <div>
          <h1 className="page-title">Collection</h1>
          <p className="page-subtitle">All books</p>
        </div>
        <span className="header-count">{books.length}</span>
      </div>

      <BookList books={books} />
    </PageShell>
  )
}
