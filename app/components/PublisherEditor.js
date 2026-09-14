'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PublisherEditor({ publisher }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: publisher.name || '',
    city: publisher.city || '',
    country: publisher.country || '',
    founded_year: publisher.founded_year ?? '',
    defunct_year: publisher.defunct_year ?? '',
    website: publisher.website || '',
    notes: publisher.notes || '',
  })

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    setSaving(true)
    const res = await fetch(`/api/publishers/${publisher.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      setOpen(false)
      router.refresh()
    } else {
      alert('Save failed')
    }
  }

  return (
    <div className="pe-wrap">
      <style>{`
        .pe-btn {
          font-family: var(--mono); font-size: 0.6rem;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--muted); background: transparent;
          border: 1px solid var(--rule); padding: 0.55rem 1rem;
          cursor: pointer; transition: all 0.15s;
        }
        .pe-btn:hover { color: var(--ink); border-color: var(--ink); }
        .pe-panel {
          margin-top: 1.5rem; padding: 1.5rem 1.75rem;
          border: 1px solid var(--rule); background: var(--warm-mid);
          max-width: 620px;
        }
        .pe-row { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1.2rem; }
        .pe-row label {
          font-family: var(--mono); font-size: 0.55rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--muted);
        }
        .pe-row input, .pe-row textarea {
          font-family: var(--serif); font-size: 0.95rem; color: var(--ink);
          background: transparent; border: none;
          border-bottom: 1px solid var(--rule);
          padding: 0.4rem 0; outline: none;
        }
        .pe-row textarea { min-height: 90px; resize: vertical; font-style: italic; line-height: 1.5; }
        .pe-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 480px) { .pe-grid2 { grid-template-columns: 1fr; gap: 0; } }
        .pe-row input:focus, .pe-row textarea:focus { border-bottom-color: var(--coral); }
        .pe-actions { display: flex; gap: 0.75rem; margin-top: 1rem; }
        .pe-save {
          font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--parchment); background: var(--coral);
          border: none; padding: 0.6rem 1.1rem; cursor: pointer;
        }
        .pe-save:disabled { opacity: 0.5; cursor: not-allowed; }
        .pe-cancel {
          font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--muted); background: transparent;
          border: 1px solid var(--rule); padding: 0.6rem 1.1rem; cursor: pointer;
        }
      `}</style>

      {!open ? (
        <button className="pe-btn" onClick={() => setOpen(true)}>Edit Publisher</button>
      ) : (
        <div className="pe-panel">
          <div className="pe-row">
            <label>Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="pe-grid2">
            <div className="pe-row">
              <label>City</label>
              <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. New York" />
            </div>
            <div className="pe-row">
              <label>Country</label>
              <input value={form.country} onChange={e => set('country', e.target.value)} placeholder="e.g. USA" />
            </div>
          </div>
          <div className="pe-grid2">
            <div className="pe-row">
              <label>Founded</label>
              <input type="number" value={form.founded_year} onChange={e => set('founded_year', e.target.value)} placeholder="e.g. 1898" />
            </div>
            <div className="pe-row">
              <label>Defunct (optional)</label>
              <input type="number" value={form.defunct_year} onChange={e => set('defunct_year', e.target.value)} placeholder="year ceased" />
            </div>
          </div>
          <div className="pe-row">
            <label>Website</label>
            <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="e.g. penguinrandomhouse.com" />
          </div>
          <div className="pe-row">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          <div className="pe-actions">
            <button className="pe-save" onClick={save} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="pe-cancel" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
