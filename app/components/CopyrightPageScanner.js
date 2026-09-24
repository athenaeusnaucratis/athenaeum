'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

// Fields shown in the preview panel, in the same order as the meta grid on the book page
const FIELD_ORDER = [
  ['title', 'Title'],
  ['subtitle', 'Subtitle'],
  ['isbn_13', 'ISBN-13'],
  ['isbn_10', 'ISBN-10'],
  ['publisher', 'Publisher'],
  ['country_of_origin', 'Country'],
  ['publication_year', 'Year'],
  ['edition', 'Edition'],
  ['printing_number', 'Printing'],
  ['language', 'Language'],
  ['original_language', 'Original Language'],
  ['editor', 'Editor'],
  ['text_by', 'Text'],
  ['translators', 'Translators'],
  ['photographer', 'Photographer'],
  ['cover_photographer', 'Cover Photo'],
  ['food_stylist', 'Food Stylist'],
  ['designer', 'Designer'],
  ['cover_designer', 'Cover Design'],
  ['art_director', 'Art Director'],
  ['illustrator', 'Illustrator'],
]

function isEmpty(v) {
  return v == null || v === '' || v === '—'
}

export default function CopyrightPageScanner({ book, publisher }) {
  const router = useRouter()
  const fileRef = useRef(null)
  const [scanning, setScanning] = useState(false)
  const [applying, setApplying] = useState(false)
  const [extracted, setExtracted] = useState(null)
  const [selected, setSelected] = useState({})
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const current = {
    title: book.title,
    subtitle: book.subtitle,
    isbn_13: book.isbn_13,
    isbn_10: book.isbn_10,
    publisher,
    country_of_origin: book.country_of_origin,
    publication_year: book.publication_year,
    edition: book.edition,
    printing_number: book.printing_number,
    language: book.language,
    original_language: book.original_language,
    editor: book.editor,
    text_by: book.text_by,
    translators: book.translators,
    photographer: book.photographer,
    cover_photographer: book.cover_photographer,
    food_stylist: book.food_stylist,
    designer: book.designer,
    cover_designer: book.cover_designer,
    art_director: book.art_director,
    illustrator: book.illustrator,
  }

  function openPicker() {
    setError(null); setNotice(null); setExtracted(null); setSelected({})
    fileRef.current?.click()
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/books/${book.id}/scan-copyright-page`, {
        method: 'POST',
        body: fd,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Scan failed')
      setExtracted(json.extracted)
      // Default: check fields that are empty on the book AND non-empty in the scan
      const initSel = {}
      for (const [k] of FIELD_ORDER) {
        if (!isEmpty(json.extracted[k]) && isEmpty(current[k])) {
          initSel[k] = true
        }
      }
      setSelected(initSel)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setError(err.message)
    } finally {
      setScanning(false)
    }
  }

  function toggle(k) {
    setSelected(s => ({ ...s, [k]: !s[k] }))
  }

  function selectAll(mode) {
    const next = {}
    for (const [k] of FIELD_ORDER) {
      if (isEmpty(extracted[k])) continue
      if (mode === 'all') next[k] = true
      else if (mode === 'empties') next[k] = isEmpty(current[k])
      else if (mode === 'none') next[k] = false
    }
    setSelected(next)
  }

  async function apply() {
    if (!extracted) return
    const payload = {}
    for (const [k] of FIELD_ORDER) {
      if (selected[k] && !isEmpty(extracted[k])) payload[k] = extracted[k]
    }
    if (Object.keys(payload).length === 0) {
      setError('Select at least one field to apply.')
      return
    }
    setApplying(true); setError(null)
    try {
      const res = await fetch(`/api/books/${book.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Save failed')
      setNotice(`Applied ${Object.keys(payload).length} field${Object.keys(payload).length === 1 ? '' : 's'}.`)
      setExtracted(null); setSelected({})
      router.refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="cps-wrap">
      <style>{`
        .cps-wrap { margin-top: 2.5rem; }
        .cps-header {
          display: flex; align-items: baseline; gap: 1rem; flex-wrap: wrap;
          margin-bottom: 0.7rem;
        }
        .cps-label {
          font-family: var(--mono); font-size: 0.6rem;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--muted);
        }
        .cps-btn {
          font-family: var(--mono); font-size: 0.6rem;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--muted); background: transparent;
          border: 1px solid var(--rule);
          padding: 0.55rem 1rem; cursor: pointer;
          transition: all 0.15s;
        }
        .cps-btn:hover { color: var(--ink); border-color: var(--ink); }
        .cps-btn.primary { color: var(--parchment); background: var(--coral); border-color: var(--coral); }
        .cps-btn.primary:hover { opacity: 0.85; color: var(--parchment); }
        .cps-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cps-error { font-family: var(--mono); font-size: 0.65rem; color: #d64f4f; margin-top: 0.6rem; }
        .cps-notice { font-family: var(--mono); font-size: 0.65rem; color: var(--coral); margin-top: 0.6rem; }

        .cps-panel {
          margin-top: 1rem;
          border: 1px solid var(--rule);
          background: var(--warm-mid);
        }
        .cps-panel-head {
          padding: 0.9rem 1.25rem;
          border-bottom: 1px solid var(--rule);
          display: flex; gap: 0.6rem; flex-wrap: wrap;
          align-items: center; justify-content: space-between;
        }
        .cps-panel-head .lhs {
          font-family: var(--mono); font-size: 0.58rem;
          letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted);
        }
        .cps-panel-head .rhs { display: flex; gap: 0.4rem; }
        .cps-mini {
          font-family: var(--mono); font-size: 0.55rem;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--muted); background: transparent;
          border: 1px solid var(--rule); padding: 0.3rem 0.55rem;
          cursor: pointer;
        }
        .cps-mini:hover { color: var(--ink); border-color: var(--ink); }

        .cps-row {
          display: grid; grid-template-columns: auto 130px 1fr 1fr;
          gap: 0.8rem; align-items: baseline;
          padding: 0.55rem 1.25rem;
          border-bottom: 1px dashed var(--rule);
        }
        .cps-row:last-child { border-bottom: none; }
        .cps-row.dim { opacity: 0.45; }
        .cps-row input[type="checkbox"] { accent-color: var(--coral); width: 16px; height: 16px; cursor: pointer; }
        .cps-row .k {
          font-family: var(--mono); font-size: 0.58rem;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--muted);
        }
        .cps-row .v {
          font-family: var(--serif); font-size: 0.9rem; color: var(--muted);
          line-height: 1.4; overflow-wrap: anywhere;
        }
        .cps-row .v.set { color: var(--ink); }
        .cps-row .v.new { color: var(--coral); }
        .cps-row .v.empty::before { content: '—'; color: var(--rule); }

        .cps-panel-actions {
          padding: 0.9rem 1.25rem;
          border-top: 1px solid var(--rule);
          display: flex; gap: 0.6rem; align-items: center; justify-content: flex-end;
        }

        @media (max-width: 640px) {
          .cps-row { grid-template-columns: auto 1fr; }
          .cps-row .v { grid-column: 2; }
          .cps-row .v.set::before { content: 'CURRENT: '; font-family: var(--mono); font-size: 0.5rem; color: var(--rule); letter-spacing: 0.1em; margin-right: 0.3rem; }
          .cps-row .v.new::before { content: 'SCANNED: '; font-family: var(--mono); font-size: 0.5rem; color: var(--rule); letter-spacing: 0.1em; margin-right: 0.3rem; }
        }
      `}</style>

      <div className="cps-header">
        <span className="cps-label">Copyright Page Scan</span>
        <button className="cps-btn" onClick={openPicker} disabled={scanning || applying}>
          {scanning ? 'Scanning…' : extracted ? 'Rescan' : 'Scan Copyright Page'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
      </div>

      {error && <p className="cps-error">{error}</p>}
      {notice && <p className="cps-notice">{notice}</p>}

      {extracted && (
        <div className="cps-panel">
          <div className="cps-panel-head">
            <span className="lhs">Review · check fields to apply</span>
            <span className="rhs">
              <button className="cps-mini" onClick={() => selectAll('empties')}>Empties</button>
              <button className="cps-mini" onClick={() => selectAll('all')}>All</button>
              <button className="cps-mini" onClick={() => selectAll('none')}>None</button>
            </span>
          </div>

          {FIELD_ORDER.map(([k, label]) => {
            const scanned = extracted[k]
            const cur = current[k]
            const scanEmpty = isEmpty(scanned)
            return (
              <div key={k} className={`cps-row${scanEmpty ? ' dim' : ''}`}>
                <input
                  type="checkbox"
                  checked={!!selected[k]}
                  disabled={scanEmpty}
                  onChange={() => toggle(k)}
                />
                <span className="k">{label}</span>
                <span className={`v ${isEmpty(cur) ? 'empty' : 'set'}`}>{isEmpty(cur) ? '' : String(cur)}</span>
                <span className={`v ${scanEmpty ? 'empty' : 'new'}`}>{scanEmpty ? '' : String(scanned)}</span>
              </div>
            )
          })}

          <div className="cps-panel-actions">
            <button className="cps-btn" onClick={() => { setExtracted(null); setSelected({}) }} disabled={applying}>
              Cancel
            </button>
            <button className="cps-btn primary" onClick={apply} disabled={applying || Object.values(selected).every(v => !v)}>
              {applying ? 'Applying…' : `Apply ${Object.values(selected).filter(Boolean).length} field${Object.values(selected).filter(Boolean).length === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
