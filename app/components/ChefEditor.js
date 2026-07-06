'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FIELDS = [
  { key: 'full_name', label: 'Full name', required: true },
  { key: 'sort_name', label: 'Sort name' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'birth_year', label: 'Birth year', type: 'number' },
  { key: 'death_year', label: 'Death year', type: 'number' },
  { key: 'restaurants', label: 'Restaurants', full: true },
  { key: 'specialties', label: 'Specialties', full: true },
  { key: 'photo_url', label: 'Photo URL', full: true },
  { key: 'notes', label: 'Notes', full: true, textarea: true },
]

export default function ChefEditor({ chef }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    full_name: chef.full_name ?? '',
    sort_name: chef.sort_name ?? '',
    nationality: chef.nationality ?? '',
    birth_year: chef.birth_year ?? '',
    death_year: chef.death_year ?? '',
    restaurants: chef.restaurants ?? '',
    specialties: chef.specialties ?? '',
    photo_url: chef.photo_url ?? '',
    notes: chef.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave() {
    if (!form.full_name.trim()) { setError('Name is required.'); return }
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/chefs/${chef.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (!res.ok) {
      const json = await res.json()
      setError(json.error || 'Save failed')
      return
    }
    setEditing(false)
    router.refresh()
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} style={{
        fontFamily: 'var(--mono)', fontSize: '0.65rem', letterSpacing: '0.08em',
        textTransform: 'uppercase', color: 'var(--muted)', background: 'transparent',
        border: '1px solid var(--rule)', padding: '0.45rem 0.9rem', cursor: 'pointer',
      }}>
        Edit
      </button>
    )
  }

  return (
    <div style={{
      width: '100%', border: '1px solid var(--rule)', background: 'var(--warm-mid)',
      padding: '2rem',
    }}>
      <style>{`
        .ce-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem 2rem; }
        .ce-field { display: flex; flex-direction: column; gap: 0.3rem; }
        .ce-field.full { grid-column: 1 / -1; }
        .ce-field label {
          font-family: var(--mono); font-size: 0.55rem;
          letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted);
        }
        .ce-field input, .ce-field textarea {
          font-family: var(--serif); font-size: 1rem; color: var(--ink);
          background: transparent; border: none; border-bottom: 1px solid var(--rule);
          padding: 0.3rem 0; outline: none; width: 100%;
        }
        .ce-field textarea { border: 1px solid var(--rule); padding: 0.5rem; resize: vertical; min-height: 80px; }
        .ce-field input:focus, .ce-field textarea:focus { border-color: var(--coral); }
      `}</style>
      {error && <div style={{ color: 'var(--coral)', fontFamily: 'var(--mono)', fontSize: '0.7rem', marginBottom: '1rem' }}>{error}</div>}
      <div className="ce-grid">
        {FIELDS.map(f => (
          <div key={f.key} className={`ce-field${f.full ? ' full' : ''}`}>
            <label>{f.label}{f.required ? ' *' : ''}</label>
            {f.textarea ? (
              <textarea value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} rows={3} />
            ) : (
              <input type={f.type || 'text'} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <button onClick={handleSave} disabled={saving} style={{
          fontFamily: 'var(--mono)', fontSize: '0.65rem', letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--parchment)', background: 'var(--coral)',
          border: 'none', padding: '0.6rem 1.2rem', cursor: 'pointer',
        }}>{saving ? 'Saving…' : 'Save'}</button>
        <button onClick={() => setEditing(false)} style={{
          fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--muted)',
          background: 'transparent', border: 'none', cursor: 'pointer',
        }}>Cancel</button>
      </div>
    </div>
  )
}
