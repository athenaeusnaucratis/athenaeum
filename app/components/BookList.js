'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

const PAGE_SIZE = 50

export default function BookList({ books }) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState('recent')
  const [sortDir, setSortDir] = useState('desc')
  const [filterLang, setFilterLang] = useState('')
  const [filterCondition, setFilterCondition] = useState('')
  const [filterFormat, setFilterFormat] = useState('')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('grid')

  const languages = useMemo(() =>
    [...new Set(books.map(b => b.language).filter(Boolean))].sort(), [books])
  const conditions = useMemo(() =>
    [...new Set(books.map(b => b.condition).filter(Boolean))].sort(), [books])
  const formats = useMemo(() =>
    [...new Set(books.map(b => b.format).filter(Boolean))].sort(), [books])

  // Filter
  const filtered = useMemo(() => {
    let result = books
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(book => {
        const author = book.authors?.[0]?.authors?.full_name ?? ''
        return (
          book.title.toLowerCase().includes(q) ||
          (book.subtitle ?? '').toLowerCase().includes(q) ||
          author.toLowerCase().includes(q) ||
          (book.isbn_13 ?? '').toLowerCase().includes(q) ||
          (book.isbn_10 ?? '').toLowerCase().includes(q) ||
          (book.language ?? '').toLowerCase().includes(q) ||
          (book.condition ?? '').toLowerCase().includes(q) ||
          (book.format ?? '').toLowerCase().includes(q)
        )
      })
    }
    if (filterLang) result = result.filter(b => b.language === filterLang)
    if (filterCondition) result = result.filter(b => b.condition === filterCondition)
    if (filterFormat) result = result.filter(b => b.format === filterFormat)
    return result
  }, [books, query, filterLang, filterCondition, filterFormat])

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let va, vb
      switch (sortKey) {
        case 'title':
          va = a.title.toLowerCase(); vb = b.title.toLowerCase(); break
        case 'author':
          va = (a.authors?.[0]?.authors?.full_name ?? '').toLowerCase()
          vb = (b.authors?.[0]?.authors?.full_name ?? '').toLowerCase(); break
        case 'year':
          va = a.publication_year ?? 0; vb = b.publication_year ?? 0; break
        case 'value':
          va = Number(a.estimated_value_usd) || 0; vb = Number(b.estimated_value_usd) || 0; break
        case 'recent':
          va = a.created_at ?? ''; vb = b.created_at ?? ''; break
        default: va = ''; vb = ''
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleFilterChange(setter) {
    return (e) => { setter(e.target.value); setPage(1) }
  }

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  function sortIndicator(key) {
    if (sortKey !== key) return ''
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  const activeFilterCount = [filterLang, filterCondition, filterFormat].filter(Boolean).length

  // Generate page buttons
  const pageButtons = []
  for (let i = 1; i <= Math.min(totalPages, 7); i++) pageButtons.push(i)

  return (
    <>
      <style>{`
        /* ── TOOLBAR ── */
        .toolbar {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.4rem 5rem;
          border-bottom: 1px solid var(--rule);
          background: var(--warm-mid);
          animation: fadeUp 0.6s 0.2s ease both;
          flex-wrap: wrap;
        }

        .search-wrap {
          flex: 1;
          max-width: 380px;
          position: relative;
        }

        .search-wrap input {
          width: 100%;
          background: var(--parchment);
          border: 1px solid var(--rule);
          color: var(--ink);
          font-family: var(--sans);
          font-size: 0.75rem;
          font-weight: 300;
          letter-spacing: 0.04em;
          padding: 0.6rem 1rem 0.6rem 2.4rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .search-wrap input::placeholder { color: var(--muted); }
        .search-wrap input:focus { border-color: var(--coral); }
        .search-wrap input::-webkit-search-cancel-button { display: none; }

        .search-icon {
          position: absolute;
          left: 0.8rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
          font-size: 0.75rem;
          pointer-events: none;
        }

        .filter-select {
          background: var(--parchment);
          border: 1px solid var(--rule);
          color: var(--muted);
          font-family: var(--sans);
          font-size: 0.7rem;
          font-weight: 300;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.6rem 2rem 0.6rem 1rem;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238a8070' stroke-width='1.2' fill='none'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.7rem center;
        }
        .filter-select:focus { border-color: var(--coral); color: var(--ink); }

        .toolbar-spacer { flex: 1; }

        .sort-label {
          font-family: var(--mono);
          font-size: 0.62rem;
          color: var(--muted);
          letter-spacing: 0.12em;
          white-space: nowrap;
          cursor: pointer;
          transition: color 0.2s;
        }
        .sort-label:hover { color: var(--ink); }

        .search-count {
          font-family: var(--mono);
          font-size: 0.62rem;
          color: var(--muted);
          letter-spacing: 0.1em;
        }

        /* ── VIEW TOGGLE ── */
        .view-toggle {
          display: flex;
          border: 1px solid var(--rule);
        }

        .view-btn {
          background: none;
          border: none;
          padding: 0.5rem 0.8rem;
          color: var(--muted);
          cursor: pointer;
          font-size: 0.8rem;
          transition: background 0.15s, color 0.15s;
          display: flex;
          align-items: center;
        }
        .view-btn + .view-btn { border-left: 1px solid var(--rule); }
        .view-btn.active { background: var(--coral); color: var(--parchment); }
        .view-btn:not(.active):hover { background: var(--rule); color: var(--ink); }

        /* ── GRID VIEW ── */
        .books-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          padding: 3rem 5rem;
          gap: 2.5rem;
          animation: fadeUp 0.6s 0.3s ease both;
        }

        .book-card {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
        }

        .book-cover {
          width: 100%;
          aspect-ratio: 2/3;
          position: relative;
          overflow: hidden;
          border: 1px solid var(--rule);
          transition: border-color 0.2s;
        }
        .book-card:hover .book-cover { border-color: var(--coral); }

        .book-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .book-cover-bg {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.2rem;
          text-align: center;
        }

        .book-cover-text {
          font-family: var(--serif);
          font-size: 0.72rem;
          font-style: italic;
          color: var(--muted);
          line-height: 1.4;
        }

        /* Color variants */
        .book-card:nth-child(6n+1) .book-cover { background: #1f1d18; }
        .book-card:nth-child(6n+2) .book-cover { background: #181c18; }
        .book-card:nth-child(6n+3) .book-cover { background: #1e1816; }
        .book-card:nth-child(6n+4) .book-cover { background: #161a1e; }
        .book-card:nth-child(6n+5) .book-cover { background: #1c1b16; }
        .book-card:nth-child(6n+6) .book-cover { background: #1a1c18; }

        .book-card-title {
          font-family: var(--serif);
          font-size: 0.85rem;
          font-weight: 400;
          color: var(--ink);
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.2s;
        }
        .book-card:hover .book-card-title { color: var(--coral); }

        .book-card-author {
          font-family: var(--mono);
          font-size: 0.6rem;
          color: var(--muted);
          letter-spacing: 0.06em;
          margin-top: -0.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .book-card-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
        }

        .book-card-year {
          font-family: var(--mono);
          font-size: 0.6rem;
          color: var(--muted);
          letter-spacing: 0.06em;
        }

        .book-card-value {
          font-family: var(--mono);
          font-size: 0.62rem;
          color: var(--coral);
          letter-spacing: 0.06em;
        }

        /* ── TABLE VIEW ── */
        .books-table-wrap {
          padding: 2rem 5rem 3rem;
          animation: fadeUp 0.4s ease both;
        }

        .books-table {
          width: 100%;
          border-collapse: collapse;
        }

        .books-table thead tr {
          border-bottom: 1px solid var(--rule);
        }

        .books-table th {
          font-family: var(--mono);
          font-size: 0.6rem;
          font-weight: 400;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--muted);
          padding: 0.8rem 1rem;
          text-align: left;
          cursor: pointer;
          white-space: nowrap;
          user-select: none;
          transition: color 0.15s;
        }
        .books-table th:first-child { padding-left: 0; }
        .books-table th:last-child { padding-right: 0; text-align: right; }
        .books-table th:hover { color: var(--ink); }
        .books-table th.sorted { color: var(--coral); }

        .books-table tbody tr {
          border-bottom: 1px solid var(--rule);
          transition: background 0.15s;
          cursor: pointer;
        }
        .books-table tbody tr:hover { background: var(--warm-mid); }

        .books-table td {
          font-family: var(--sans);
          font-size: 0.78rem;
          font-weight: 300;
          color: var(--ink);
          padding: 1rem 1rem;
          vertical-align: middle;
        }
        .books-table td:first-child { padding-left: 0; }
        .books-table td:last-child { padding-right: 0; text-align: right; }

        .td-title {
          font-family: var(--serif);
          font-size: 0.9rem;
          font-weight: 400;
          max-width: 420px;
        }
        .td-title-main {
          color: var(--ink);
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .td-subtitle {
          font-family: var(--serif);
          font-size: 0.78rem;
          font-style: italic;
          color: var(--muted);
          margin-top: 0.1rem;
        }
        .td-author {
          font-family: var(--mono);
          font-size: 0.65rem;
          color: var(--muted);
          letter-spacing: 0.04em;
        }
        .td-year {
          font-family: var(--mono);
          font-size: 0.7rem;
          color: var(--muted);
          letter-spacing: 0.06em;
          white-space: nowrap;
        }
        .td-value {
          font-family: var(--mono);
          font-size: 0.72rem;
          color: var(--coral);
          letter-spacing: 0.06em;
          white-space: nowrap;
        }
        .td-value.none { color: var(--muted); }

        .no-results {
          font-family: var(--serif);
          font-style: italic;
          color: var(--muted);
          padding: 3rem 0;
        }

        /* ── PAGINATION ── */
        .pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2rem 5rem;
          border-top: 1px solid var(--rule);
          animation: fadeUp 0.6s 0.45s ease both;
        }

        .pagination-info {
          font-family: var(--mono);
          font-size: 0.62rem;
          color: var(--muted);
          letter-spacing: 0.1em;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .page-btn {
          font-family: var(--mono);
          font-size: 0.68rem;
          letter-spacing: 0.06em;
          background: none;
          border: 1px solid var(--rule);
          color: var(--muted);
          padding: 0.45rem 0.8rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .page-btn:hover:not(:disabled) { border-color: var(--ink); color: var(--ink); }
        .page-btn:disabled { opacity: 0.3; cursor: default; }
        .page-btn.active { background: var(--coral); border-color: var(--coral); color: var(--parchment); }
        .page-btn.nav-arrow { padding: 0.45rem 1rem; font-family: var(--serif); font-size: 1rem; }

        /* ── FILTER BAR ── */
        .filter-bar {
          display: flex;
          gap: 1.5rem;
          align-items: flex-end;
          padding: 1rem 5rem;
          border-bottom: 1px solid var(--rule);
          background: var(--warm-mid);
          flex-wrap: wrap;
        }

        .filter-item {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .filter-item label {
          font-family: var(--mono);
          font-size: 0.55rem;
          font-weight: 400;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .filter-item select {
          font-family: var(--sans);
          font-size: 0.72rem;
          font-weight: 300;
          color: var(--ink);
          background: var(--parchment);
          border: 1px solid var(--rule);
          padding: 0.4rem 0.6rem;
          outline: none;
          min-width: 120px;
        }
        .filter-item select:focus { border-color: var(--coral); }

        .clear-filters {
          font-family: var(--mono);
          font-size: 0.6rem;
          font-weight: 300;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0.4rem 0;
          transition: color 0.15s;
        }
        .clear-filters:hover { color: var(--coral); }

        .filter-toggle-btn {
          font-family: var(--sans);
          font-size: 0.7rem;
          font-weight: 300;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          background: var(--parchment);
          border: 1px solid var(--rule);
          padding: 0.6rem 1rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .filter-toggle-btn:hover { border-color: var(--ink); color: var(--ink); }
        .filter-toggle-btn.has-active { border-color: var(--coral); color: var(--coral); }

        @media (max-width: 1200px) {
          .books-grid { grid-template-columns: repeat(4, 1fr); padding: 2rem 3rem; }
        }
        @media (max-width: 768px) {
          .toolbar { padding: 1rem 1.25rem; }
          .books-grid { grid-template-columns: repeat(3, 1fr); padding: 1.5rem 1.25rem; gap: 1.5rem; }
          .books-table-wrap { padding: 1rem 1.25rem 2rem; }
          .pagination { padding: 1.5rem 1.25rem; flex-direction: column; gap: 1rem; }
          .filter-bar { padding: 1rem 1.25rem; }
        }
        @media (max-width: 480px) {
          .books-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      {/* TOOLBAR */}
      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input
            type="search"
            placeholder="Search title, author, ISBN…"
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1) }}
          />
        </div>

        <button
          className={`filter-toggle-btn${activeFilterCount ? ' has-active' : ''}`}
          onClick={() => setShowFilters(p => !p)}
        >
          Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
        </button>

        <div className="toolbar-spacer"></div>

        {(query || activeFilterCount > 0) && (
          <span className="search-count">{sorted.length} of {books.length}</span>
        )}

        <span className="sort-label" onClick={() => handleSort(sortKey)}>
          Sort {sortDir === 'asc' ? '↑' : '↓'} {sortKey.charAt(0).toUpperCase() + sortKey.slice(1)}
        </span>

        <div className="view-toggle">
          <button
            className={`view-btn${viewMode === 'grid' ? ' active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="0" y="0" width="6" height="6"/><rect x="8" y="0" width="6" height="6"/>
              <rect x="0" y="8" width="6" height="6"/><rect x="8" y="8" width="6" height="6"/>
            </svg>
          </button>
          <button
            className={`view-btn${viewMode === 'table' ? ' active' : ''}`}
            onClick={() => setViewMode('table')}
            title="List view"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="0" y="1" width="14" height="2"/><rect x="0" y="6" width="14" height="2"/>
              <rect x="0" y="11" width="14" height="2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      {showFilters && (
        <div className="filter-bar">
          <div className="filter-item">
            <label>Language</label>
            <select value={filterLang} onChange={handleFilterChange(setFilterLang)}>
              <option value="">All</option>
              {languages.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label>Condition</label>
            <select value={filterCondition} onChange={handleFilterChange(setFilterCondition)}>
              <option value="">All</option>
              {conditions.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label>Format</label>
            <select value={filterFormat} onChange={handleFilterChange(setFilterFormat)}>
              <option value="">All</option>
              {formats.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          {activeFilterCount > 0 && (
            <button className="clear-filters" onClick={() => {
              setFilterLang(''); setFilterCondition(''); setFilterFormat(''); setPage(1)
            }}>Clear</button>
          )}
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' ? (
        <div className="books-grid">
          {paginated.map(book => {
            const author = book.authors?.[0]?.authors?.full_name
            const val = book.estimated_value_usd
            return (
              <Link key={book.id} href={`/books/${book.id}`} className="book-card">
                <div className="book-cover">
                  {book.cover_image_url ? (
                    <img src={book.cover_image_url} alt="" />
                  ) : (
                    <div className="book-cover-bg">
                      <span className="book-cover-text">{book.title}</span>
                    </div>
                  )}
                </div>
                <div className="book-card-title">{book.title}</div>
                {author && <div className="book-card-author">{author}</div>}
                <div className="book-card-meta">
                  <span className="book-card-year">{book.publication_year ?? ''}</span>
                  {val ? (
                    <span className="book-card-value">${Number(val).toFixed(2)}</span>
                  ) : <span />}
                </div>
              </Link>
            )
          })}
          {paginated.length === 0 && (
            <div className="no-results" style={{ gridColumn: '1 / -1' }}>No books found</div>
          )}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="books-table-wrap">
          <table className="books-table">
            <thead>
              <tr>
                <th className={sortKey === 'title' ? 'sorted' : ''} onClick={() => handleSort('title')}>
                  Title{sortIndicator('title')}
                </th>
                <th className={sortKey === 'author' ? 'sorted' : ''} onClick={() => handleSort('author')}>
                  Author{sortIndicator('author')}
                </th>
                <th className={sortKey === 'year' ? 'sorted' : ''} onClick={() => handleSort('year')}>
                  Year{sortIndicator('year')}
                </th>
                <th className={sortKey === 'value' ? 'sorted' : ''} onClick={() => handleSort('value')}>
                  Value{sortIndicator('value')}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(book => (
                <tr key={book.id}>
                  <td>
                    <Link href={`/books/${book.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className="td-title">
                        <div className="td-title-main">{book.title}</div>
                        {book.subtitle && <div className="td-subtitle">{book.subtitle}</div>}
                      </div>
                    </Link>
                  </td>
                  <td className="td-author">
                    {book.authors?.[0]?.authors?.full_name ?? '—'}
                  </td>
                  <td className="td-year">{book.publication_year ?? '—'}</td>
                  <td>
                    {book.estimated_value_usd
                      ? <span className="td-value">${Number(book.estimated_value_usd).toFixed(2)}</span>
                      : <span className="td-value none">—</span>
                    }
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={4} className="no-results">No books found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="pagination">
          <span className="pagination-info">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div className="pagination-controls">
            <button
              className="page-btn nav-arrow"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >←</button>
            {pageButtons.map(p => (
              <button
                key={p}
                className={`page-btn${page === p ? ' active' : ''}`}
                onClick={() => setPage(p)}
              >{p}</button>
            ))}
            {totalPages > 7 && <span style={{ color: 'var(--muted)', padding: '0 0.3rem' }}>…</span>}
            <button
              className="page-btn nav-arrow"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >→</button>
          </div>
        </div>
      )}
    </>
  )
}
