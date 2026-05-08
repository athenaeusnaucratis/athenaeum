'use client'

import { useEffect, useState } from 'react'

export default function CollectionPicker({ bookId, initialCollections }) {
  const [all, setAll] = useState([])
  const [active, setActive] = useState(initialCollections ?? [])
  const [showPicker, setShowPicker] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (showPicker && all.length === 0) {
      fetch('/api/collections').then(r => r.json()).then(setAll)
    }
  }, [showPicker])

  async function toggle(col) {
    const isActive = active.some(c => c.id === col.id)
    const method = isActive ? 'DELETE' : 'POST'
    await fetch(`/api/books/${bookId}/collections`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection_id: col.id }),
    })
    if (isActive) {
      setActive(prev => prev.filter(c => c.id !== col.id))
    } else {
      setActive(prev => [...prev, col])
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    if (!res.ok) return
    const col = await res.json()
    setAll(prev => [...prev, col].sort((a, b) => a.name.localeCompare(b.name)))
    setNewName('')
    await toggle(col)
  }

  return (
    <div className="collection-picker-wrap">
      <p className="cp-label">Collections</p>

      {active.length > 0 && (
        <div className="cp-active">
          {active.map(c => (
            <span key={c.id} className="cp-chip active">{c.name}</span>
          ))}
        </div>
      )}

      <button className="cp-toggle" onClick={() => setShowPicker(p => !p)}>
        {showPicker ? 'Done' : active.length ? 'Edit Collections' : '+ Add to Collection'}
      </button>

      {showPicker && (
        <div className="cp-panel">
          <div className="cp-list">
            {all.map(col => (
              <button
                key={col.id}
                className={`cp-item${active.some(c => c.id === col.id) ? ' selected' : ''}`}
                onClick={() => toggle(col)}
              >
                {col.name}
              </button>
            ))}
          </div>
          <form className="cp-new-form" onSubmit={handleCreate}>
            <input
              type="text"
              placeholder="New collection…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <button type="submit">Add</button>
          </form>
        </div>
      )}
    </div>
  )
}
