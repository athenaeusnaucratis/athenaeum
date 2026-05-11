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
      condition,
      format,
      isbn_13,
      isbn_10,
      cover_image_url,
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
          align-items: baseline;
          justify-content: space-between;
          margin-top: 2.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e0e0e0;
        }

        .header-count {
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          font-weight: 300;
          color: #999;
        }

        /* ── TABLE ── */
        .table-wrap { margin-top: 0; }

        table { width: 100%; border-collapse: collapse; }
        thead tr { border-bottom: 1px solid #e0e0e0; }

        thead th {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          font-weight: 400;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #999;
          padding: 0.75rem 0.75rem 0.6rem;
          text-align: left;
        }
        thead th:first-child { padding-left: 0; }
        thead th:last-child  { padding-right: 0; text-align: right; }

        tbody tr {
          border-bottom: 1px solid #f0f0f0;
        }
        tbody tr:hover { background-color: #fafafa; }

        tbody td { padding: 0.75rem; vertical-align: top; }
        tbody td:first-child { padding-left: 0; }
        tbody td:last-child  { padding-right: 0; text-align: right; }

        .book-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem; font-weight: 500; color: #2c2c2c; line-height: 1.3;
        }
        .book-subtitle {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.85rem; font-style: italic; color: #999;
          display: block; margin-top: 0.1rem;
        }
        .book-author { font-family: 'Cormorant Garamond', serif; font-size: 0.95rem; color: #666; }
        .book-year { font-family: 'DM Mono', monospace; font-size: 0.75rem; font-weight: 300; color: #999; }
        .book-value { font-family: 'DM Mono', monospace; font-size: 0.75rem; font-weight: 300; color: #666; }
        .book-value.empty { color: #ccc; }

        /* ── SEARCH ── */
        .search-wrap { padding: 1.25rem 0 0; display: flex; align-items: center; gap: 1rem; }
        .search-input {
          font-family: 'DM Mono', monospace; font-size: 0.75rem; font-weight: 300;
          color: #2c2c2c; background: transparent; border: none;
          border-bottom: 1px solid #e0e0e0; padding: 0.4rem 0; width: 300px;
          outline: none; transition: border-color 0.15s ease;
        }
        .search-input::placeholder { color: #ccc; }
        .search-input:focus { border-bottom-color: #2c2c2c; }
        .search-input::-webkit-search-cancel-button { display: none; }
        .search-count {
          font-family: 'DM Mono', monospace; font-size: 0.65rem; font-weight: 300;
          color: #999;
        }
        .no-results td {
          font-family: 'Cormorant Garamond', serif; font-style: italic;
          color: #999; padding: 2rem 0;
        }

        /* ── SORT ── */
        .sortable {
          cursor: pointer;
          user-select: none;
          transition: color 0.15s ease;
        }
        .sortable:hover { color: #2c2c2c; }

        /* ── FILTERS ── */
        .filter-toggle {
          font-family: 'DM Mono', monospace; font-size: 0.65rem; font-weight: 300;
          letter-spacing: 0.06em; text-transform: uppercase; color: #999;
          background: transparent; border: 1px solid #e0e0e0;
          padding: 0.3rem 0.7rem; cursor: pointer; transition: all 0.15s ease;
        }
        .filter-toggle:hover { border-color: #2c2c2c; color: #2c2c2c; }
        .filter-toggle.active { border-color: #2c2c2c; color: #2c2c2c; }

        .filter-bar {
          display: flex; gap: 1.5rem; align-items: flex-end;
          padding: 1rem 0 0; flex-wrap: wrap;
        }
        .filter-item { display: flex; flex-direction: column; gap: 0.3rem; }
        .filter-item label {
          font-family: 'DM Mono', monospace; font-size: 0.55rem; font-weight: 400;
          letter-spacing: 0.1em; text-transform: uppercase; color: #999;
        }
        .filter-item select {
          font-family: 'DM Mono', monospace; font-size: 0.7rem; font-weight: 300;
          color: #2c2c2c; background: transparent; border: none;
          border-bottom: 1px solid #e0e0e0; padding: 0.3rem 0; outline: none;
          min-width: 120px;
        }
        .filter-item select:focus { border-bottom-color: #2c2c2c; }
        .clear-filters {
          font-family: 'DM Mono', monospace; font-size: 0.6rem; font-weight: 300;
          letter-spacing: 0.06em; text-transform: uppercase; color: #999;
          background: transparent; border: none; cursor: pointer; padding: 0.3rem 0;
        }
        .clear-filters:hover { color: #c45a3c; }

        /* ── PAGINATION ── */
        .pagination {
          display: flex; align-items: center; justify-content: center;
          gap: 1.5rem; margin-top: 2rem; padding-top: 1.5rem;
          border-top: 1px solid #f0f0f0;
        }
        .page-btn {
          font-family: 'DM Mono', monospace; font-size: 0.65rem; font-weight: 300;
          color: #999; background: transparent; border: none; cursor: pointer; padding: 0;
        }
        .page-btn:hover:not(:disabled) { color: #2c2c2c; }
        .page-btn:disabled { opacity: 0.3; cursor: default; }
        .page-info {
          font-family: 'DM Mono', monospace; font-size: 0.65rem; font-weight: 300;
          color: #999;
        }

        .col-title  { width: 45%; }
        .col-author { width: 30%; }
        .col-year   { width: 10%; }
        .col-value  { width: 15%; }

        /* ── VIEW TOGGLE ── */
        .view-toggle { display: flex; gap: 0.25rem; margin-left: auto; }
        .vt-btn {
          font-size: 0.9rem; line-height: 1; padding: 0.2rem 0.4rem;
          background: transparent; border: 1px solid #e0e0e0; color: #ccc;
          cursor: pointer; transition: all 0.15s ease;
        }
        .vt-btn:hover { border-color: #2c2c2c; color: #2c2c2c; }
        .vt-btn.active { border-color: #2c2c2c; color: #2c2c2c; }

        /* ── GRID VIEW ── */
        .grid-wrap {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 2rem 1.5rem;
          margin-top: 1.5rem;
        }
        .grid-card {
          text-decoration: none; color: inherit;
          display: flex; flex-direction: column; gap: 0.4rem;
        }
        .grid-card:hover .grid-title { color: #c45a3c; }
        .grid-cover {
          aspect-ratio: 2/3; overflow: hidden;
          background: #f5f5f5;
        }
        .grid-cover img {
          width: 100%; height: 100%; object-fit: cover;
        }
        .grid-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          background: #f5f5f5;
        }
        .grid-placeholder span {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem; font-weight: 500; color: #ccc;
        }
        .grid-info { display: flex; flex-direction: column; gap: 0.1rem; }
        .grid-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.85rem; font-weight: 500; color: #2c2c2c;
          line-height: 1.25; transition: color 0.15s ease;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .grid-author {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem; font-weight: 300; color: #999;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .grid-value {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem; font-weight: 300; color: #999;
        }
        .no-results-grid {
          grid-column: 1 / -1;
          font-family: 'Cormorant Garamond', serif; font-style: italic;
          color: #999; padding: 2rem 0;
        }
      `}</style>

      <div className="collection-header">
        <div>
          <h1 className="page-title">Collection</h1>
        </div>
        <span className="header-count">{books.length} books</span>
      </div>

      <BookList books={books} />
    </PageShell>
  )
}
