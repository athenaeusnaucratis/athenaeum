'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EditableBio({ authorId, initialText, canEdit = true, apiBase = 'authors', bodyKey = 'bio' }) {
  const router = useRouter()
  const [text, setText] = useState(initialText || '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [refining, setRefining] = useState(false)
  const [refineError, setRefineError] = useState(null)
  const textareaRef = useRef(null)

  function resizeTextarea() {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      resizeTextarea()
    }
  }, [editing])

  useEffect(() => {
    if (editing) resizeTextarea()
  }, [text, editing])

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/${apiBase}/${authorId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [bodyKey]: text.trim() || null }),
    })
    setSaving(false)
    if (res.ok) {
      setEditing(false)
      router.refresh()
    }
  }

  function handleCancel() {
    setText(initialText || '')
    setEditing(false)
    setRefineError(null)
  }

  async function handleRefine() {
    setRefining(true)
    setRefineError(null)
    try {
      const res = await fetch(`/api/${apiBase}/${authorId}/describe`, { method: 'POST' })
      const json = await res.json()
      const returned = json[bodyKey]
      if (!res.ok || !returned) {
        setRefineError(json.error || 'AI request failed')
      } else {
        setText(returned)
        if (!editing) setEditing(true)
      }
    } catch (e) {
      setRefineError(e.message || 'Network error')
    }
    setRefining(false)
  }

  if (!editing) {
    if (!canEdit) {
      if (!text) return null
      return (
        <div className="author-bio-section">
          <p className="bio-text">{text}</p>
        </div>
      )
    }
    return (
      <div className="author-bio-section" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem' }}>
          <div style={{ flex: 1 }}>
            {text ? (
              <p className="bio-text">{text}</p>
            ) : (
              <p className="bio-text" style={{ opacity: 0.5, fontStyle: 'italic' }}>No bio yet.</p>
            )}
            {refineError && (
              <p style={{ color: 'var(--coral)', fontFamily: 'var(--mono)', fontSize: '0.7rem', marginTop: '0.6rem' }}>
                {refineError}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', flexShrink: 0 }}>
            <button
              onClick={handleRefine}
              disabled={refining}
              style={{
                fontFamily: 'var(--mono)', fontSize: '0.58rem', letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--muted)', background: 'transparent',
                border: 'none', cursor: 'pointer', padding: 0,
              }}
              title="Generate or improve bio with AI"
            >
              {refining ? 'AI…' : 'Refine with AI'}
            </button>
            <button
              onClick={() => setEditing(true)}
              style={{
                fontFamily: 'var(--mono)', fontSize: '0.58rem', letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--muted)', background: 'transparent',
                border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="author-bio-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: '0.58rem', letterSpacing: '0.18em',
          textTransform: 'uppercase', color: 'var(--muted)',
        }}>Bio</span>
        <button
          onClick={handleRefine}
          disabled={refining}
          style={{
            fontFamily: 'var(--mono)', fontSize: '0.58rem', letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--muted)', background: 'transparent',
            border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          {refining ? 'Generating…' : 'Refine with AI'}
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Write a biographical note…"
        rows={4}
        style={{
          fontFamily: 'var(--serif)', fontSize: '1rem', color: 'var(--ink)',
          background: 'transparent', border: '1px solid var(--rule)',
          padding: '0.8rem', outline: 'none', width: '100%', resize: 'vertical',
          lineHeight: 1.7, minHeight: '120px',
        }}
      />
      {refineError && (
        <p style={{ color: 'var(--coral)', fontFamily: 'var(--mono)', fontSize: '0.7rem', marginTop: '0.6rem' }}>
          {refineError}
        </p>
      )}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            fontFamily: 'var(--mono)', fontSize: '0.65rem', letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--parchment)', background: 'var(--coral)',
            border: 'none', padding: '0.6rem 1.2rem', cursor: 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={handleCancel}
          style={{
            fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--muted)',
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
