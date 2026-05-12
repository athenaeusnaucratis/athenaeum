'use client'

import { useEffect, useState } from 'react'

const TYPE_LABELS = { cuisine: 'Cuisine', restaurant: 'Restaurant', reference: 'Reference', other: 'Other' }
const TYPE_ORDER = ['cuisine', 'restaurant', 'reference', 'other']

export default function TagPicker({ bookId, initialTags }) {
  const [allTags, setAllTags] = useState([])
  const [activeTags, setActiveTags] = useState(initialTags ?? [])
  const [showPicker, setShowPicker] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('cuisine')

  useEffect(() => {
    if (showPicker && allTags.length === 0) {
      fetch('/api/tags').then(r => r.json()).then(setAllTags)
    }
  }, [showPicker])

  async function toggle(tag) {
    const isActive = activeTags.some(t => t.id === tag.id)
    const method = isActive ? 'DELETE' : 'POST'
    await fetch(`/api/books/${bookId}/tags`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag_id: tag.id }),
    })
    if (isActive) {
      setActiveTags(prev => prev.filter(t => t.id !== tag.id))
    } else {
      setActiveTags(prev => [...prev, tag])
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), type: newType }),
    })
    if (!res.ok) return
    const tag = await res.json()
    setAllTags(prev => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)))
    setNewName('')
    await toggle(tag)
  }

  const grouped = {}
  for (const tag of allTags) {
    if (!grouped[tag.type]) grouped[tag.type] = []
    grouped[tag.type].push(tag)
  }

  return (
    <div className="tag-picker-wrap">
      <style>{`
        .tag-picker-wrap { margin-top: 2.5rem; }

        .tag-section-label {
          font-family: var(--mono);
          font-size: 0.6rem; font-weight: 400;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--muted); margin-bottom: 0.75rem;
        }

        .active-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }

        .tag-chip {
          font-family: var(--mono);
          font-size: 0.65rem; font-weight: 400;
          letter-spacing: 0.08em;
          padding: 0.35rem 0.8rem;
          border: 1px solid var(--rule);
          background: transparent;
          color: var(--muted);
          cursor: default;
        }

        .tag-chip.active { border-color: var(--coral); color: var(--coral); }

        .edit-tags-btn {
          font-family: var(--mono);
          font-size: 0.6rem; font-weight: 300;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--muted); background: transparent;
          border: none; cursor: pointer; padding: 0;
          transition: color 0.15s;
        }
        .edit-tags-btn:hover { color: var(--ink); }

        .picker-panel {
          margin-top: 1.5rem;
          padding: 1.5rem;
          border: 1px solid var(--rule);
          background: var(--warm-mid);
        }

        .picker-type-group { margin-bottom: 1.25rem; }
        .picker-type-label {
          font-family: var(--mono);
          font-size: 0.55rem; font-weight: 400;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--muted); margin-bottom: 0.5rem;
        }

        .picker-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }

        .picker-tag {
          font-family: var(--mono);
          font-size: 0.6rem; font-weight: 300;
          padding: 0.3rem 0.7rem;
          border: 1px solid var(--rule);
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .picker-tag:hover { border-color: var(--ink); color: var(--ink); }
        .picker-tag.selected { border-color: var(--coral); color: var(--coral); background: rgba(212,98,58,0.08); }

        .new-tag-form {
          display: flex; gap: 0.5rem; align-items: flex-end;
          margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--rule);
        }

        .new-tag-form input {
          font-family: var(--mono); font-size: 0.7rem;
          color: var(--ink); background: transparent; border: none;
          border-bottom: 1px solid var(--rule); padding: 0.3rem 0;
          outline: none; width: 140px;
        }
        .new-tag-form input:focus { border-bottom-color: var(--coral); }
        .new-tag-form input::placeholder { color: var(--rule); }

        .new-tag-form select {
          font-family: var(--mono); font-size: 0.6rem;
          color: var(--muted); background: var(--parchment); border: none;
          border-bottom: 1px solid var(--rule); padding: 0.3rem 0;
          outline: none;
        }

        .new-tag-form button {
          font-family: var(--mono); font-size: 0.6rem;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--ink); background: var(--coral); border: none;
          padding: 0.4rem 0.8rem; cursor: pointer;
          transition: opacity 0.15s;
        }
        .new-tag-form button:hover { opacity: 0.85; }
      `}</style>

      <p className="tag-section-label">Tags</p>

      {activeTags.length > 0 && (
        <div className="active-tags">
          {activeTags.map(t => (
            <span key={t.id} className="tag-chip active">{t.name}</span>
          ))}
        </div>
      )}

      <button className="edit-tags-btn" onClick={() => setShowPicker(p => !p)}>
        {showPicker ? 'Done' : activeTags.length ? 'Edit Tags' : '+ Add Tags'}
      </button>

      {showPicker && (
        <div className="picker-panel">
          {TYPE_ORDER.map(type => {
            const tags = grouped[type]
            if (!tags?.length) return null
            return (
              <div key={type} className="picker-type-group">
                <p className="picker-type-label">{TYPE_LABELS[type]}</p>
                <div className="picker-tags">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      className={`picker-tag${activeTags.some(t => t.id === tag.id) ? ' selected' : ''}`}
                      onClick={() => toggle(tag)}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}

          <form className="new-tag-form" onSubmit={handleCreate}>
            <input
              type="text"
              placeholder="New tag…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <select value={newType} onChange={e => setNewType(e.target.value)}>
              {TYPE_ORDER.map(t => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
            <button type="submit">Add</button>
          </form>
        </div>
      )}
    </div>
  )
}
