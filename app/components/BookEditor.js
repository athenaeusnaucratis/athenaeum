'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const FIELDS = [
  { key: 'title', label: 'Title', full: true, required: true },
  { key: 'subtitle', label: 'Subtitle', full: true },
  { key: 'publication_year', label: 'Year', type: 'number' },
  { key: 'printing_number', label: 'Printing', select: ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', 'First Edition', 'Limited Edition', 'Reprint', 'Facsimile', 'Revised'] },
  { key: 'page_count', label: 'Pages', type: 'number' },
  { key: 'format', label: 'Format', select: ['', 'Hardcover', 'Paperback', 'Spiral-bound', 'Board Book', 'Ring-bound', 'Leather-bound', 'Loose Leaf', 'Mass Market', 'Trade Paperback'] },
  { key: 'language', label: 'Language', select: ['', 'English', 'French', 'German', 'Spanish', 'Italian', 'Portuguese', 'Dutch', 'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Turkish', 'Persian', 'Hebrew', 'Greek', 'Latin', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Polish', 'Czech', 'Hungarian', 'Romanian', 'Thai', 'Vietnamese', 'Indonesian', 'Hindi', 'Other'] },
  { key: 'original_language', label: 'Original Language', select: ['', 'English', 'French', 'German', 'Spanish', 'Italian', 'Portuguese', 'Dutch', 'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Turkish', 'Persian', 'Hebrew', 'Greek', 'Latin', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Polish', 'Czech', 'Hungarian', 'Romanian', 'Thai', 'Vietnamese', 'Indonesian', 'Hindi', 'Other'] },
  { key: 'country_of_origin', label: 'Country', select: ['', 'United States', 'United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Canada', 'Australia', 'India', 'Japan', 'China', 'South Korea', 'Brazil', 'Mexico', 'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Russia', 'Turkey', 'Iran', 'Israel', 'Greece', 'Portugal', 'Ireland', 'New Zealand', 'Singapore', 'Thailand', 'Other'] },
  { key: 'condition', label: 'Condition', select: ['', 'mint', 'very_good', 'good', 'fair', 'poor'] },
  { key: 'location', label: 'Location', select: ['', 'SF', 'PH'] },
  { key: 'isbn_13', label: 'ISBN-13' },
  { key: 'isbn_10', label: 'ISBN-10' },
  // estimated_value_usd intentionally omitted here — value is managed by the Market Value
  // panel (with history, currency-aware manual entry, and auto lookup). Including it in
  // this raw editor caused stale form state to wipe a freshly-fetched value on Save.
  { key: 'editor', label: 'Editor' },
  { key: 'text_by', label: 'Text' },
  { key: 'photographer', label: 'Photographer' },
  { key: 'cover_photographer', label: 'Cover Photo' },
  { key: 'food_stylist', label: 'Food Stylist' },
  { key: 'designer', label: 'Designer' },
  { key: 'cover_designer', label: 'Cover Design' },
  { key: 'art_director', label: 'Art Director' },
  { key: 'illustrator', label: 'Illustrator' },
  { key: 'cover_image_url', label: 'Cover Image URL', full: true },
  { key: 'description', label: 'Description', full: true, textarea: true },
]

export default function BookEditor({ book, authors, publisher, chefs, restaurants }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)

  // authors prop is an array of {id, full_name}. Normalize to array of name strings.
  const initialAuthors = Array.isArray(authors)
    ? authors.map(a => (typeof a === 'string' ? a : a?.full_name)).filter(Boolean)
    : (authors && typeof authors === 'string' && authors !== '—')
      ? authors.split(',').map(s => s.trim()).filter(Boolean)
      : []

  const initialChefs = Array.isArray(chefs)
    ? chefs.map(c => (typeof c === 'string' ? c : c?.full_name)).filter(Boolean)
    : []

  // Seed the multi-entry Translator input from book.translators (comma-separated text)
  const initialTranslators = (book.translators || '')
    .split(',').map(s => s.trim()).filter(Boolean)

  const [form, setForm] = useState({
    title: book.title ?? '',
    subtitle: book.subtitle ?? '',
    publication_year: book.publication_year ?? '',
    printing_number: book.printing_number ?? '',
    page_count: book.page_count ?? '',
    format: book.format ?? '',
    language: book.language ?? '',
    original_language: book.original_language ?? '',
    country_of_origin: book.country_of_origin ?? '',
    condition: book.condition ?? '',
    location: book.location ?? '',
    isbn_13: book.isbn_13 ?? '',
    isbn_10: book.isbn_10 ?? '',
    editor: book.editor ?? '',
    text_by: book.text_by ?? '',
    photographer: book.photographer ?? '',
    cover_photographer: book.cover_photographer ?? '',
    food_stylist: book.food_stylist ?? '',
    designer: book.designer ?? '',
    cover_designer: book.cover_designer ?? '',
    art_director: book.art_director ?? '',
    illustrator: book.illustrator ?? '',
    cover_image_url: book.cover_image_url ?? '',
    description: book.description ?? '',
    publisher: typeof publisher === 'string' && publisher !== '—' ? publisher : '',
    is_signed: !!book.is_signed,
    signed_notes: book.signed_notes ?? '',
  })
  const [authorList, setAuthorList] = useState(initialAuthors.length ? initialAuthors : [''])
  const [chefList, setChefList] = useState(initialChefs.length ? initialChefs : [''])
  const [translatorList, setTranslatorList] = useState(initialTranslators.length ? initialTranslators : [''])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const coverInputRef = useRef(null)

  function updateAuthor(idx, value) {
    setAuthorList(prev => prev.map((a, i) => i === idx ? value : a))
  }
  function addAuthor() { setAuthorList(prev => [...prev, '']) }
  function removeAuthor(idx) {
    setAuthorList(prev => prev.length === 1 ? [''] : prev.filter((_, i) => i !== idx))
  }

  function updateChef(idx, value) {
    setChefList(prev => prev.map((a, i) => i === idx ? value : a))
  }
  function addChef() { setChefList(prev => [...prev, '']) }
  function removeChef(idx) {
    setChefList(prev => prev.length === 1 ? [''] : prev.filter((_, i) => i !== idx))
  }

  function updateTranslator(idx, value) {
    setTranslatorList(prev => prev.map((a, i) => i === idx ? value : a))
  }
  function addTranslator() { setTranslatorList(prev => [...prev, '']) }
  function removeTranslator(idx) {
    setTranslatorList(prev => prev.length === 1 ? [''] : prev.filter((_, i) => i !== idx))
  }

  async function handleCoverUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`/api/books/${book.id}/cover`, { method: 'POST', body: fd })
    const json = await res.json()
    setUploadingCover(false)
    if (!res.ok) { setError(json.error ?? 'Upload failed'); return }
    setForm(p => ({ ...p, cover_image_url: json.cover_image_url }))
    router.refresh()
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('Title is required.'); return }
    setSaving(true)
    setError(null)

    const cleanedAuthors = authorList.map(a => a.trim()).filter(Boolean)
    const cleanedChefs = chefList.map(a => a.trim()).filter(Boolean)
    const cleanedTranslators = translatorList.map(a => a.trim()).filter(Boolean)
    const payload = {
      ...form,
      authors: cleanedAuthors,
      chefs: cleanedChefs,
      translators: cleanedTranslators.join(', '),
    }

    const res = await fetch(`/api/books/${book.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error ?? 'Failed to save.'); return }
    setEditing(false)
    router.refresh()
  }

  function startEdit() {
    // Re-sync form state from the LATEST book prop before opening editor.
    // Otherwise stale state can wipe fields updated by Auto Lookup / Refresh from APIs.
    setForm({
      title: book.title ?? '',
      subtitle: book.subtitle ?? '',
      publication_year: book.publication_year ?? '',
      printing_number: book.printing_number ?? '',
      page_count: book.page_count ?? '',
      format: book.format ?? '',
      language: book.language ?? '',
      original_language: book.original_language ?? '',
      country_of_origin: book.country_of_origin ?? '',
      condition: book.condition ?? '',
      location: book.location ?? '',
      isbn_13: book.isbn_13 ?? '',
      isbn_10: book.isbn_10 ?? '',
      editor: book.editor ?? '',
      text_by: book.text_by ?? '',
      photographer: book.photographer ?? '',
      cover_photographer: book.cover_photographer ?? '',
      food_stylist: book.food_stylist ?? '',
      designer: book.designer ?? '',
      cover_designer: book.cover_designer ?? '',
      art_director: book.art_director ?? '',
      illustrator: book.illustrator ?? '',
      cover_image_url: book.cover_image_url ?? '',
      description: book.description ?? '',
      publisher: typeof publisher === 'string' && publisher !== '—' ? publisher : '',
      is_signed: !!book.is_signed,
      signed_notes: book.signed_notes ?? '',
    })
    setAuthorList(initialAuthors.length ? initialAuthors : [''])
    setChefList(initialChefs.length ? initialChefs : [''])
    setTranslatorList(initialTranslators.length ? initialTranslators : [''])
    setEditing(true)
  }

  if (!editing) {
    return (
      <button className="edit-btn" onClick={startEdit}>
        Edit
      </button>
    )
  }

  return (
    <div className="editor-panel">
      <style>{`
        .author-row {
          display: flex; gap: 0.5rem; align-items: center;
          margin-bottom: 0.4rem;
        }
        .author-row input { flex: 1; }
        .author-row-remove {
          font-family: var(--mono); font-size: 0.7rem; color: var(--muted);
          background: transparent; border: none; cursor: pointer; padding: 0.2rem 0.4rem;
        }
        .author-row-remove:hover { color: var(--coral); }
        .author-add-btn {
          font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--muted);
          background: transparent; border: 1px dashed var(--rule);
          padding: 0.4rem 0.7rem; cursor: pointer; margin-top: 0.3rem;
          transition: border-color 0.15s, color 0.15s;
        }
        .author-add-btn:hover { border-color: var(--coral); color: var(--coral); }
      `}</style>
      {error && <p className="editor-error">{error}</p>}
      <div className="editor-grid">
        {FIELDS.map(f => (
          <div key={f.key} className={`editor-field${f.full ? ' full' : ''}`}>
            <label>{f.label}{f.required ? ' *' : ''}</label>
            {f.select ? (
              <select
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              >
                {f.select.map(v => (
                  <option key={v} value={v}>{v ? v.replace(/_/g, ' ') : '—'}</option>
                ))}
              </select>
            ) : f.textarea ? (
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
        <div className="editor-field full">
          <label>Author{authorList.filter(Boolean).length > 1 ? 's' : ''}</label>
          {authorList.map((a, i) => (
            <div key={i} className="author-row">
              <input
                type="text"
                value={a}
                onChange={e => updateAuthor(i, e.target.value)}
                placeholder={i === 0 ? 'Primary author' : `Co-author ${i + 1}`}
              />
              {(authorList.length > 1 || a) && (
                <button type="button" className="author-row-remove" onClick={() => removeAuthor(i)} title="Remove">×</button>
              )}
            </div>
          ))}
          <button type="button" className="author-add-btn" onClick={addAuthor}>+ Add co-author</button>
        </div>
        <div className="editor-field full">
          <label>Chef{chefList.filter(Boolean).length > 1 ? 's' : ''}</label>
          {chefList.map((a, i) => (
            <div key={i} className="author-row">
              <input
                type="text"
                value={a}
                onChange={e => updateChef(i, e.target.value)}
                placeholder={i === 0 ? 'Chef name' : `Chef ${i + 1}`}
              />
              {(chefList.length > 1 || a) && (
                <button type="button" className="author-row-remove" onClick={() => removeChef(i)} title="Remove">×</button>
              )}
            </div>
          ))}
          <button type="button" className="author-add-btn" onClick={addChef}>+ Add chef</button>
        </div>
        <div className="editor-field full">
          <label>Translator{translatorList.filter(Boolean).length > 1 ? 's' : ''}</label>
          {translatorList.map((a, i) => (
            <div key={i} className="author-row">
              <input
                type="text"
                value={a}
                onChange={e => updateTranslator(i, e.target.value)}
                placeholder={i === 0 ? 'Translator name' : `Translator ${i + 1}`}
              />
              {(translatorList.length > 1 || a) && (
                <button type="button" className="author-row-remove" onClick={() => removeTranslator(i)} title="Remove">×</button>
              )}
            </div>
          ))}
          <button type="button" className="author-add-btn" onClick={addTranslator}>+ Add translator</button>
        </div>
        <div className="editor-field">
          <label>Publisher</label>
          <input
            type="text"
            value={form.publisher}
            onChange={e => setForm(p => ({ ...p, publisher: e.target.value }))}
          />
        </div>
        <div className="editor-field full">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!form.is_signed}
              onChange={e => setForm(p => ({ ...p, is_signed: e.target.checked }))}
              style={{ accentColor: 'var(--coral)', width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span>Signed copy</span>
          </label>
          {form.is_signed && (
            <input
              type="text"
              placeholder="Signed by whom? / where? (optional, e.g. 'Signed by author, title page, 2018')"
              value={form.signed_notes}
              onChange={e => setForm(p => ({ ...p, signed_notes: e.target.value }))}
              style={{ marginTop: '0.5rem' }}
            />
          )}
        </div>
      </div>
      <div className="editor-field full">
        <label>Cover Photo</label>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button type="button" className="save-btn" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}>
            {uploadingCover ? 'Uploading…' : 'Upload Cover'}
          </button>
          <input ref={coverInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleCoverUpload} />
          {form.cover_image_url && <span style={{ fontFamily: 'DM Mono', fontSize: '0.6rem', color: '#9c8e7e' }}>✓ Cover set</span>}
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
