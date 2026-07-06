'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewChefForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: '', nationality: '', birth_year: '', death_year: '',
    restaurants: '', specialties: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('Name is required.'); return }
    setSaving(true)
    const res = await fetch('/api/chefs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error || 'Save failed'); return }
    router.push(`/chefs/${json.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} style={{
      padding: '3rem 5rem 4rem', display: 'grid',
      gridTemplateColumns: '1fr 1fr', gap: '1.5rem 2.5rem', maxWidth: '900px',
    }}>
      <style>{`
        .cf-field { display: flex; flex-direction: column; gap: 0.4rem; }
        .cf-field.full { grid-column: 1 / -1; }
        .cf-field label {
          font-family: var(--mono); font-size: 0.6rem; font-weight: 400;
          letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted);
        }
        .cf-field input {
          font-family: var(--serif); font-size: 1rem; color: var(--ink);
          background: transparent; border: none; border-bottom: 1px solid var(--rule);
          padding: 0.4rem 0; outline: none; width: 100%;
        }
        .cf-field input:focus { border-bottom-color: var(--coral); }
      `}</style>
      {error && (
        <div className="cf-field full" style={{ color: 'var(--coral)', fontFamily: 'var(--mono)', fontSize: '0.7rem' }}>{error}</div>
      )}
      <div className="cf-field full">
        <label>Full name *</label>
        <input type="text" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} required />
      </div>
      <div className="cf-field">
        <label>Nationality</label>
        <input type="text" value={form.nationality} onChange={e => setForm(p => ({ ...p, nationality: e.target.value }))} placeholder="French, Japanese, …" />
      </div>
      <div className="cf-field">
        <label>Birth year</label>
        <input type="number" value={form.birth_year} onChange={e => setForm(p => ({ ...p, birth_year: e.target.value }))} placeholder="1970" />
      </div>
      <div className="cf-field">
        <label>Death year</label>
        <input type="number" value={form.death_year} onChange={e => setForm(p => ({ ...p, death_year: e.target.value }))} placeholder="If applicable" />
      </div>
      <div className="cf-field full">
        <label>Restaurants</label>
        <input type="text" value={form.restaurants} onChange={e => setForm(p => ({ ...p, restaurants: e.target.value }))} placeholder="Alinea, Next, The Aviary" />
      </div>
      <div className="cf-field full">
        <label>Specialties</label>
        <input type="text" value={form.specialties} onChange={e => setForm(p => ({ ...p, specialties: e.target.value }))} placeholder="French pastry, Nordic cuisine, …" />
      </div>
      <div className="cf-field full" style={{ flexDirection: 'row', gap: '1rem', marginTop: '1rem' }}>
        <button type="submit" disabled={saving} style={{
          fontFamily: 'var(--mono)', fontSize: '0.65rem', letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--parchment)', background: 'var(--coral)',
          border: 'none', padding: '0.6rem 1.2rem', cursor: 'pointer',
        }}>
          {saving ? 'Saving…' : 'Create Chef'}
        </button>
      </div>
    </form>
  )
}
