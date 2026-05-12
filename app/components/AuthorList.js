'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export default function AuthorList({ authors }) {
  const [activeLetter, setActiveLetter] = useState('All')

  // Group authors by first letter of sort_name (or full_name)
  const grouped = useMemo(() => {
    const groups = {}
    for (const a of authors) {
      const name = a.sort_name || a.full_name || ''
      const letter = (name[0] || '?').toUpperCase()
      if (!groups[letter]) groups[letter] = []
      groups[letter].push(a)
    }
    return groups
  }, [authors])

  // Which letters have authors
  const populatedLetters = useMemo(() => new Set(Object.keys(grouped)), [grouped])

  // Filtered groups
  const visibleGroups = useMemo(() => {
    if (activeLetter === 'All') return grouped
    if (grouped[activeLetter]) return { [activeLetter]: grouped[activeLetter] }
    return {}
  }, [grouped, activeLetter])

  // Running index
  let index = 0

  return (
    <>
      <style>{`
        /* ── ALPHA NAV ── */
        .alpha-nav {
          display: flex;
          align-items: center;
          padding: 0 5rem;
          border-bottom: 1px solid var(--rule);
          background: var(--warm-mid);
          overflow-x: auto;
          gap: 0;
          animation: fadeUp 0.6s 0.12s ease both;
        }

        .alpha-btn {
          font-family: var(--mono);
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          color: var(--muted);
          background: none;
          border: none;
          border-right: 1px solid var(--rule);
          padding: 1rem 1.1rem;
          cursor: pointer;
          transition: color 0.15s, background 0.15s;
          white-space: nowrap;
        }
        .alpha-btn:first-child { border-left: 1px solid var(--rule); }
        .alpha-btn:hover { color: var(--ink); background: var(--rule); }
        .alpha-btn.active { color: var(--coral); }
        .alpha-btn.empty { color: var(--rule); cursor: default; }

        /* ── AUTHOR LIST ── */
        .author-list {
          animation: fadeUp 0.6s 0.2s ease both;
        }

        .letter-group { border-bottom: 1px solid var(--rule); }

        .letter-head {
          display: grid;
          grid-template-columns: 80px 1fr;
          border-bottom: 1px solid var(--rule);
          background: var(--warm-mid);
        }

        .letter-char {
          font-family: var(--serif);
          font-size: 2rem;
          font-weight: 300;
          font-style: italic;
          color: var(--coral);
          padding: 1rem 0 1rem 5rem;
          border-right: 1px solid var(--rule);
          line-height: 1;
          display: flex;
          align-items: center;
        }

        .letter-count {
          font-family: var(--mono);
          font-size: 0.58rem;
          letter-spacing: 0.14em;
          color: var(--muted);
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          text-transform: uppercase;
        }

        .author-row {
          display: grid;
          grid-template-columns: 80px 1fr auto;
          border-bottom: 1px solid var(--rule);
          cursor: pointer;
          transition: background 0.15s;
          align-items: center;
          text-decoration: none;
          color: inherit;
        }
        .author-row:last-child { border-bottom: none; }
        .author-row:hover { background: var(--warm-mid); }

        .author-row-index {
          font-family: var(--mono);
          font-size: 0.55rem;
          letter-spacing: 0.12em;
          color: var(--rule);
          padding: 1.4rem 0 1.4rem 5rem;
          border-right: 1px solid var(--rule);
        }

        .author-row-main {
          padding: 1.4rem 2.5rem;
          display: flex;
          align-items: baseline;
          gap: 2rem;
          min-width: 0;
        }

        .author-name {
          font-family: var(--serif);
          font-size: 1.15rem;
          font-weight: 400;
          color: var(--ink);
          white-space: nowrap;
          transition: color 0.15s;
        }
        .author-row:hover .author-name { color: var(--coral); }

        .author-notable {
          font-family: var(--serif);
          font-size: 0.82rem;
          font-style: italic;
          color: var(--muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.15s;
        }
        .author-row:hover .author-notable { color: var(--ink); }

        .author-row-right {
          display: flex;
          align-items: center;
          gap: 2.5rem;
          padding: 1.4rem 3rem 1.4rem 0;
        }

        .author-book-count {
          font-family: var(--mono);
          font-size: 0.65rem;
          letter-spacing: 0.08em;
          color: var(--muted);
          white-space: nowrap;
        }
        .author-book-count strong {
          font-weight: 400;
          color: var(--ink);
        }

        .author-arrow {
          font-family: var(--serif);
          font-size: 1rem;
          color: var(--rule);
          transition: color 0.15s, transform 0.15s;
        }
        .author-row:hover .author-arrow { color: var(--coral); transform: translateX(4px); }

        .empty-state {
          font-family: var(--serif);
          font-size: 1rem;
          font-style: italic;
          color: var(--muted);
          padding: 3rem 5rem;
        }

        @media (max-width: 768px) {
          .alpha-nav { padding: 0 1.25rem; }
          .alpha-btn { padding: 0.8rem 0.7rem; font-size: 0.6rem; }
          .letter-char { padding-left: 1.25rem; }
          .author-row-index { padding-left: 1.25rem; }
          .author-row-main { padding: 1rem 1rem; gap: 1rem; }
          .author-row-right { padding-right: 1.25rem; gap: 1rem; }
          .author-notable { display: none; }
        }
      `}</style>

      {/* ALPHA NAV */}
      <div className="alpha-nav">
        <button
          className={`alpha-btn${activeLetter === 'All' ? ' active' : ''}`}
          onClick={() => setActiveLetter('All')}
        >All</button>
        {LETTERS.map(l => (
          <button
            key={l}
            className={`alpha-btn${activeLetter === l ? ' active' : ''}${!populatedLetters.has(l) ? ' empty' : ''}`}
            onClick={() => populatedLetters.has(l) && setActiveLetter(l)}
          >{l}</button>
        ))}
      </div>

      {/* AUTHOR LIST */}
      <div className="author-list">
        {Object.keys(visibleGroups).sort().map(letter => {
          const group = visibleGroups[letter]
          return (
            <div key={letter} className="letter-group">
              <div className="letter-head">
                <div className="letter-char">{letter}</div>
                <div className="letter-count">{group.length} author{group.length !== 1 ? 's' : ''}</div>
              </div>
              {group.map(a => {
                index++
                const notable = a.notableTitle
                  ? `${a.notableTitle}${a.notableYear ? `, ${a.notableYear}` : ''}`
                  : ''
                return (
                  <Link key={a.id} href={`/authors/${a.id}`} className="author-row">
                    <div className="author-row-index">{String(index).padStart(2, '0')}</div>
                    <div className="author-row-main">
                      <span className="author-name">{a.sort_name || a.full_name}</span>
                      {notable && <span className="author-notable">{notable}</span>}
                    </div>
                    <div className="author-row-right">
                      <span className="author-book-count">
                        <strong>{a.bookCount}</strong> book{a.bookCount !== 1 ? 's' : ''}
                      </span>
                      <span className="author-arrow">→</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )
        })}
        {Object.keys(visibleGroups).length === 0 && (
          <p className="empty-state">No authors found.</p>
        )}
      </div>
    </>
  )
}
