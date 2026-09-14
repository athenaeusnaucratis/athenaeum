'use client'

import { useEffect, useState } from 'react'

export default function ClassificationPicker({ bookId, initialClasses }) {
  const [tree, setTree] = useState([])
  const [active, setActive] = useState(initialClasses ?? [])
  const [expanded, setExpanded] = useState(new Set())
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    if (showPicker && tree.length === 0) {
      fetch('/api/classes').then(r => r.json()).then(setTree)
    }
  }, [showPicker, tree.length])

  const isActive = id => active.some(c => c.id === id)
  const primaryId = active.find(c => c.is_primary)?.id

  async function toggle(cls) {
    const active_ = isActive(cls.id)
    const method = active_ ? 'DELETE' : 'POST'
    await fetch(`/api/books/${bookId}/classes`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id: cls.id }),
    })
    if (active_) {
      setActive(prev => prev.filter(c => c.id !== cls.id))
    } else {
      setActive(prev => [...prev, { ...cls, is_primary: prev.length === 0 }])
      // Server sets primary=false by default; if this is the first class, make it primary.
      if (active.length === 0) {
        await fetch(`/api/books/${bookId}/classes`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ class_id: cls.id }),
        })
      }
    }
  }

  async function markPrimary(cls) {
    await fetch(`/api/books/${bookId}/classes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id: cls.id }),
    })
    setActive(prev => prev.map(c => ({ ...c, is_primary: c.id === cls.id })))
  }

  const genres = tree.filter(c => c.level === 'genre')
  const subsByParent = tree.filter(c => c.level === 'subcategory').reduce((acc, s) => {
    (acc[s.parent_id] ??= []).push(s)
    return acc
  }, {})

  return (
    <div className="cls-picker-wrap">
      <style>{`
        .cls-picker-wrap { margin-top: 2.5rem; }
        .cls-section-label {
          font-family: var(--mono);
          font-size: 0.6rem; font-weight: 400;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--muted); margin-bottom: 0.75rem;
        }
        .active-classes { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }
        .cls-chip {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-family: var(--mono);
          font-size: 0.65rem; font-weight: 400;
          letter-spacing: 0.08em;
          padding: 0.35rem 0.8rem;
          border: 1px solid var(--rule);
          background: transparent;
          color: var(--muted);
        }
        .cls-chip.primary { border-color: var(--coral); color: var(--coral); }
        .cls-chip .notation { color: var(--rule); font-size: 0.58rem; }
        .cls-chip.primary .notation { color: var(--coral); opacity: 0.7; }
        .cls-chip .star {
          cursor: pointer; opacity: 0.35; transition: opacity 0.15s;
          font-size: 0.7rem; user-select: none;
        }
        .cls-chip .star:hover { opacity: 1; }
        .cls-chip.primary .star { opacity: 1; }
        .edit-cls-btn {
          font-family: var(--mono);
          font-size: 0.6rem; font-weight: 300;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--muted); background: transparent;
          border: none; cursor: pointer; padding: 0;
          transition: color 0.15s;
        }
        .edit-cls-btn:hover { color: var(--ink); }

        .picker-panel {
          margin-top: 1.5rem;
          padding: 1.25rem 1.5rem;
          border: 1px solid var(--rule);
          background: var(--warm-mid);
          max-height: 60vh;
          overflow-y: auto;
        }
        .genre-row {
          display: flex; align-items: baseline; gap: 0.6rem;
          padding: 0.55rem 0; cursor: pointer;
          border-top: 1px solid var(--rule);
        }
        .genre-row:first-child { border-top: none; }
        .genre-caret {
          font-family: var(--mono); font-size: 0.65rem; color: var(--muted);
          width: 0.9rem; text-align: center;
        }
        .genre-notation {
          font-family: var(--mono); font-size: 0.58rem; color: var(--rule);
          min-width: 3.2rem;
        }
        .genre-name {
          font-family: var(--serif); font-size: 0.92rem; color: var(--ink);
          font-weight: 400; flex: 1;
        }
        .genre-name.selected { color: var(--coral); }
        .genre-toggle {
          font-family: var(--mono); font-size: 0.55rem;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--muted); border: 1px solid var(--rule);
          background: transparent; padding: 0.25rem 0.6rem;
          cursor: pointer; transition: all 0.15s;
        }
        .genre-toggle:hover { color: var(--ink); border-color: var(--ink); }
        .genre-toggle.on { color: var(--coral); border-color: var(--coral); background: rgba(212,98,58,0.08); }

        .sub-list { padding: 0.35rem 0 0.7rem 3.2rem; }
        .sub-row {
          display: flex; align-items: baseline; gap: 0.5rem;
          padding: 0.35rem 0;
          cursor: pointer;
        }
        .sub-notation {
          font-family: var(--mono); font-size: 0.55rem; color: var(--rule);
          min-width: 3rem;
        }
        .sub-name {
          font-family: var(--serif); font-size: 0.8rem; color: var(--muted);
          font-weight: 300; flex: 1;
          transition: color 0.15s;
        }
        .sub-row:hover .sub-name { color: var(--ink); }
        .sub-name.selected { color: var(--coral); }
      `}</style>

      <p className="cls-section-label">Classification</p>

      {active.length > 0 && (
        <div className="active-classes">
          {active.map(c => (
            <span key={c.id} className={`cls-chip${c.is_primary ? ' primary' : ''}`}>
              <span className="notation">{c.notation}</span>
              {c.name}
              <span className="star" title={c.is_primary ? 'Primary' : 'Make primary'} onClick={() => !c.is_primary && markPrimary(c)}>
                {c.is_primary ? '★' : '☆'}
              </span>
            </span>
          ))}
        </div>
      )}

      <button className="edit-cls-btn" onClick={() => setShowPicker(p => !p)}>
        {showPicker ? 'Done' : active.length ? 'Edit Classification' : '+ Add Classification'}
      </button>

      {showPicker && (
        <div className="picker-panel">
          {genres.map(g => {
            const gExpanded = expanded.has(g.id)
            const gActive = isActive(g.id)
            const subs = subsByParent[g.id] ?? []
            const activeSubCount = subs.filter(s => isActive(s.id)).length
            return (
              <div key={g.id}>
                <div className="genre-row" onClick={() => {
                  setExpanded(prev => {
                    const next = new Set(prev)
                    if (next.has(g.id)) next.delete(g.id); else next.add(g.id)
                    return next
                  })
                }}>
                  <span className="genre-caret">{gExpanded ? '▾' : '▸'}</span>
                  <span className="genre-notation">{g.notation}</span>
                  <span className={`genre-name${gActive ? ' selected' : ''}`}>
                    {g.name}
                    {activeSubCount > 0 && <span style={{ color: 'var(--coral)', fontSize: '0.65rem', marginLeft: '0.5rem' }}>({activeSubCount})</span>}
                  </span>
                  <button className={`genre-toggle${gActive ? ' on' : ''}`} onClick={e => { e.stopPropagation(); toggle(g) }}>
                    {gActive ? '✓ Genre' : '+ Genre'}
                  </button>
                </div>
                {gExpanded && (
                  <div className="sub-list">
                    {subs.map(s => (
                      <div key={s.id} className="sub-row" onClick={() => toggle(s)}>
                        <span className="sub-notation">{s.notation}</span>
                        <span className={`sub-name${isActive(s.id) ? ' selected' : ''}`}>
                          {isActive(s.id) ? '✓ ' : ''}{s.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
