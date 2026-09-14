'use client'

import { useEffect, useState } from 'react'

export default function CuisinePicker({ bookId, initialCuisines }) {
  const [all, setAll] = useState([])
  const [active, setActive] = useState(initialCuisines ?? [])
  const [showPicker, setShowPicker] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (showPicker && all.length === 0) {
      fetch('/api/cuisines').then(r => r.json()).then(setAll)
    }
  }, [showPicker, all.length])

  const isActive = id => active.some(c => c.id === id)

  async function toggle(cuisine) {
    const on = isActive(cuisine.id)
    const method = on ? 'DELETE' : 'POST'
    await fetch(`/api/books/${bookId}/cuisines`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cuisine_id: cuisine.id }),
    })
    if (on) setActive(prev => prev.filter(c => c.id !== cuisine.id))
    else setActive(prev => [...prev, cuisine])
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    const res = await fetch('/api/cuisines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    if (!res.ok) return
    const cuisine = await res.json()
    setAll(prev => [...prev, cuisine].sort((a, b) => a.name.localeCompare(b.name)))
    setNewName('')
    await toggle(cuisine)
  }

  return (
    <div className="cui-picker-wrap">
      <style>{`
        .cui-picker-wrap { margin-top: 2rem; }
        .cui-section-label {
          font-family: var(--mono);
          font-size: 0.6rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--muted);
          margin-bottom: 0.75rem;
        }
        .cui-active { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }
        .cui-chip {
          font-family: var(--mono); font-size: 0.65rem;
          letter-spacing: 0.08em;
          padding: 0.35rem 0.8rem;
          border: 1px solid var(--coral);
          color: var(--coral);
          background: transparent;
        }
        .edit-cui-btn {
          font-family: var(--mono); font-size: 0.6rem; font-weight: 300;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--muted); background: transparent;
          border: none; cursor: pointer; padding: 0;
        }
        .edit-cui-btn:hover { color: var(--ink); }
        .cui-panel {
          margin-top: 1rem; padding: 1.25rem 1.5rem;
          border: 1px solid var(--rule);
          background: var(--warm-mid);
        }
        .cui-list { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .cui-opt {
          font-family: var(--mono); font-size: 0.6rem;
          padding: 0.3rem 0.7rem;
          border: 1px solid var(--rule);
          background: transparent; color: var(--muted);
          cursor: pointer; transition: all 0.15s;
        }
        .cui-opt:hover { border-color: var(--ink); color: var(--ink); }
        .cui-opt.on { border-color: var(--coral); color: var(--coral); background: rgba(212,98,58,0.08); }
        .cui-new-form {
          display: flex; gap: 0.5rem; margin-top: 1rem;
          padding-top: 0.8rem; border-top: 1px solid var(--rule);
        }
        .cui-new-form input {
          font-family: var(--mono); font-size: 0.7rem;
          color: var(--ink); background: transparent; border: none;
          border-bottom: 1px solid var(--rule);
          padding: 0.3rem 0; outline: none; width: 160px;
        }
        .cui-new-form input:focus { border-bottom-color: var(--coral); }
        .cui-new-form button {
          font-family: var(--mono); font-size: 0.6rem;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--ink); background: var(--coral); border: none;
          padding: 0.4rem 0.8rem; cursor: pointer;
        }
      `}</style>

      <p className="cui-section-label">Cuisines</p>
      {active.length > 0 && (
        <div className="cui-active">
          {active.map(c => <span key={c.id} className="cui-chip">{c.name}</span>)}
        </div>
      )}
      <button className="edit-cui-btn" onClick={() => setShowPicker(p => !p)}>
        {showPicker ? 'Done' : active.length ? 'Edit Cuisines' : '+ Add Cuisines'}
      </button>

      {showPicker && (
        <div className="cui-panel">
          <div className="cui-list">
            {all.map(c => (
              <button key={c.id} className={`cui-opt${isActive(c.id) ? ' on' : ''}`} onClick={() => toggle(c)}>
                {c.name}
              </button>
            ))}
          </div>
          <form className="cui-new-form" onSubmit={handleCreate}>
            <input type="text" placeholder="New cuisine…" value={newName} onChange={e => setNewName(e.target.value)} />
            <button type="submit">Add</button>
          </form>
        </div>
      )}
    </div>
  )
}
