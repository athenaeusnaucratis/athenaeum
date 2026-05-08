'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function BookList({ books }) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? books.filter(book => {
        const q = query.toLowerCase()
        const author = book.authors?.[0]?.authors?.full_name ?? ''
        return (
          book.title.toLowerCase().includes(q) ||
          (book.subtitle ?? '').toLowerCase().includes(q) ||
          author.toLowerCase().includes(q)
        )
      })
    : books

  return (
    <>
      <div className="search-wrap">
        <input
          type="search"
          placeholder="Search by title or author…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="search-input"
        />
        {query && (
          <span className="search-count">
            {filtered.length} of {books.length}
          </span>
        )}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="col-title">Title</th>
              <th className="col-author">Author</th>
              <th className="col-year">Year</th>
              <th className="col-value">Value</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(book => (
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
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="no-results">No books match "{query}"</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
