'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

const PAGE_SIZE = 50

export default function BookList({ books }) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState('title')
  const [sortDir, setSortDir] = useState('asc')
  const [filterLang, setFilterLang] = useState('')
  const [filterCondition, setFilterCondition] = useState('')
  const [filterFormat, setFilterFormat] = useState('')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('table')

  // Extract unique values for filter dropdowns
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
          va = a.title.toLowerCase(); vb = b.title.toLowerCase()
          break
        case 'author':
          va = (a.authors?.[0]?.authors?.full_name ?? '').toLowerCase()
          vb = (b.authors?.[0]?.authors?.full_name ?? '').toLowerCase()
          break
        case 'year':
          va = a.publication_year ?? 0; vb = b.publication_year ?? 0
          break
        case 'value':
          va = Number(a.estimated_value_usd) || 0; vb = Number(b.estimated_value_usd) || 0
          break
        default:
          va = ''; vb = ''
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [filtered, sortKey, sortDir])

  // Paginate
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Reset page when filters change
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

  return (
    <>
      <div className="search-wrap">
        <input
          type="search"
          placeholder="Search title, author, ISBN, language…"
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(1) }}
          className="search-input"
        />
        <button
          className={`filter-toggle${activeFilterCount ? ' active' : ''}`}
          onClick={() => setShowFilters(p => !p)}
        >
          Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
        </button>
        <div className="view-toggle">
          <button
            className={`vt-btn${viewMode === 'table' ? ' active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Table view"
          >☰</button>
          <button
            className={`vt-btn${viewMode === 'grid' ? ' active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >▦</button>
        </div>
        {(query || activeFilterCount > 0) && (
          <span className="search-count">
            {sorted.length} of {books.length}
          </span>
        )}
      </div>

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

      {viewMode === 'table' ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="col-title sortable" onClick={() => handleSort('title')}>
                  Title{sortIndicator('title')}
                </th>
                <th className="col-author sortable" onClick={() => handleSort('author')}>
                  Author{sortIndicator('author')}
                </th>
                <th className="col-year sortable" onClick={() => handleSort('year')}>
                  Year{sortIndicator('year')}
                </th>
                <th className="col-value sortable" onClick={() => handleSort('value')}>
                  Value{sortIndicator('value')}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(book => (
                <tr key={book.id}>
                  <td className="col-title">
                    <Link href={`/books/${book.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <span className="book-title">{book.title}</span>
                      {book.subtitle && (
                        <span className="book-subtitle">{book.subtitle}</span>
                      )}
                    </Link>
                  </td>
                  <td className="col-author">
                    <span className="book-author">
                      {book.authors?.[0]?.authors?.full_name ?? '—'}
                    </span>
                  </td>
                  <td className="col-year">
                    <span className="book-year">
                      {book.publication_year ?? '—'}
                    </span>
                  </td>
                  <td className="col-value">
                    {book.estimated_value_usd
                      ? <span className="book-value">${Number(book.estimated_value_usd).toFixed(2)}</span>
                      : <span className="book-value empty">—</span>
                    }
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={4} className="no-results">No books found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid-wrap">
          {paginated.map(book => (
            <Link key={book.id} href={`/books/${book.id}`} className="grid-card">
              <div className="grid-cover">
                {book.cover_image_url
                  ? <img src={book.cover_image_url} alt="" />
                  : <div className="grid-placeholder">
                      <span>{book.title.charAt(0)}</span>
                    </div>
                }
              </div>
              <div className="grid-info">
                <span className="grid-title">{book.title}</span>
                <span className="grid-author">{book.authors?.[0]?.authors?.full_name ?? ''}</span>
                {book.estimated_value_usd && (
                  <span className="grid-value">${Number(book.estimated_value_usd).toFixed(2)}</span>
                )}
              </div>
            </Link>
          ))}
          {paginated.length === 0 && (
            <p className="no-results-grid">No books found</p>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >← Prev</button>
          <span className="page-info">{page} / {totalPages}</span>
          <button
            className="page-btn"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >Next →</button>
        </div>
      )}
    </>
  )
}
