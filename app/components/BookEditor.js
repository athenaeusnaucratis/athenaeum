'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FIELDS = [
  { key: 'title', label: 'Title', full: true, required: true },
  { key: 'subtitle', label: 'Subtitle', full: true },
  { key: 'publication_year', label: 'Year', type: 'number' },
  { key: 'edition', label: 'Edition' },
  { key: 'printing_number', label: 'Printing' },
  { key: 'page_count', label: 'Pages', type: 'number' },
  { key: 'format', label: 'Format' },
  { key: 'language', label: 'Language' },
  { key: 'country_of_origin', label: 'Country' },
  { key: 'condition', label: 'Condition' },
  { key: 'dimensions', label: 'Dimensions' },
  { key: 'isbn_13', label: 'ISBN-13' },
  { key: 'isbn_10', label: 'ISBN-10' },
  { key: 'estimated_value_usd', label: 'Est. Value (USD)', type: 'number' },
  { key: 'cover_image_url', label: 'Cover Image URL', full: true },
  { key: 'notes', label: 'Notes', full: true, textarea: true },
]

export default function BookEditor({ book, authors, publisher }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    title: book.title ?? '',
    subtitle: book.subtitle ?? '',
    publication_year: book.publication_year ?? '',
    edition: book.edition ?? '',
    printing_number: book.printing_number ?? '',
    page_count: book.page_count ?? '',
    format: book.format ?? '',
    language: book.language ?? '',
    country_of_origin: book.country_of_origin ?? '',
    condition: book.condition ?? '',
    dimensions: book.dimensions ?? '',
    isbn_13: book.isbn_13 ?? '',
    isbn_10: book.isbn_10 ?? '',
    estimated_value_usd: book.estimated_value_usd ?? '',
    cover_image_url: book.cover_image_url ?? '',
    notes: book.notes ?? '',
    author: authors,
    publisher: publisher,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave() {
    if (!form.title.trim()) { setError('Title is required.'); return }
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/books/${book.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error ?? 'Failed to save.'); return }
    setEditing(false)
    router.refresh()
  }

  if (!editing) {
    return (
      <button className="edit-btn" onClick={() => setEditing(true)}>
        Edit
      </button>
    )
  }

  return (
    <div className="editor-panel">
      {error && <p className="editor-error">{error}</p>}
      <div className="editor-grid">
        {FIELDS.map(f => (
          <div key={f.key} className={`editor-field${f.full ? ' full' : ''}`}>
            <label>{f.label}{f.required ? ' *' : ''}</label>
            {f.textarea ? (
              <textarea
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                rows={3}
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
        <div className="editor-field">
          <label>Author</label>
          <input
            type="text"
            value={form.author}
            onChange={e => setForm(p => ({ ...p, author: e.target.value }))}
          />
        </div>
        <div className="editor-field">
          <label>Publisher</label>
          <input
            type="text"
            value={form.publisher}
            onChange={e => setForm(p => ({ ...p, publisher: e.target.value }))}
          />
        </div>
      </div>
      <div className="editor-actions">
        <button className="save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button className="cancel-btn" onClick={() => setEditing(false)}>Cancel</button>
      </div>
    </div>
  )
}
