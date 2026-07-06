'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FIELDS = [
  { key: 'full_name', label: 'Full Name', required: true },
  { key: 'sort_name', label: 'Sort Name' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'birth_year', label: 'Birth Year', type: 'number' },
  { key: 'photo_url', label: 'Photo URL', full: true },
  { key: 'bio', label: 'Bio', full: true, textarea: true },
  { key: 'notes', label: 'Notes', full: true, textarea: true },
]

export default function AuthorEditor({ author }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    full_name: author.full_name ?? '',
    sort_name: author.sort_name ?? '',
    nationality: author.nationality ?? '',
    birth_year: author.birth_year ?? '',
    photo_url: author.photo_url ?? '',
    bio: author.bio ?? '',
    notes: author.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave() {
    if (!form.full_name.trim()) { setError('Name is required.'); return }
    setSaving(true)
    setError(null)

    const payload = {
      full_name: form.full_name.trim(),
      sort_name: form.sort_name.trim() || form.full_name.trim(),
      nationality: form.nationality.trim() || null,
      birth_year: form.birth_year ? parseInt(form.birth_year) : null,
      photo_url: form.photo_url.trim() || null,
      bio: form.bio.trim() || null,
      notes: form.notes.trim() || null,
    }

    const res = await fetch(`/api/authors/${author.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? 'Failed to save.')
      return
    }
    setEditing(false)
    router.refresh()
  }

  if (!editing) {
    return (
      <button className="edit-btn" onClick={() => setEditing(true)}>
        Edit details
      </button>
    )
  }

  return (
    <div className="author-editor-panel">
      {error && <p className="editor-error">{error}</p>}
      <div className="editor-grid">
        {FIELDS.map(f => (
          <div key={f.key} className={`editor-field${f.full ? ' full' : ''}`}>
            <label>{f.label}{f.required ? ' *' : ''}</label>
            {f.textarea ? (
              <textarea
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                rows={f.key === 'bio' ? 5 : 3}
              />
            ) : (
              <input
                type={f.type ?? 'text'}
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              />
            )}
          </div>
        ))}
      </div>
      <div className="editor-actions">
        <button className="save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button className="cancel-btn" onClick={() => { setEditing(false); setError(null) }}>Cancel</button>
      </div>
    </div>
  )
}
