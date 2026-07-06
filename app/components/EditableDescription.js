'use client'

import { useState, useRef, useEffect } from 'react'

export default function EditableDescription({ bookId, initialText, canEdit = true }) {
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

  function handleInput(e) {
    setText(e.target.value)
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/books/${bookId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: text.trim() || null }),
    })
    setSaving(false)
    if (res.ok) setEditing(false)
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
      const res = await fetch(`/api/books/${bookId}/describe`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok || !json.description) {
        setRefineError(json.error || 'AI request failed')
      } else {
        setText(json.description)
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
        <div className="desc-block" style={{ cursor: 'default' }}>
          <div className="desc-header">
            <span className="desc-label">Description</span>
          </div>
          <p className="desc-text">{text}</p>
        </div>
      )
    }
    return (
      <div className="desc-block" onClick={() => setEditing(true)} style={{ cursor: 'pointer' }}>
        <div className="desc-header">
          <span className="desc-label">Description</span>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className="desc-edit-btn"
              onClick={e => { e.stopPropagation(); handleRefine() }}
              disabled={refining}
              title="Regenerate description with AI"
            >
              {refining ? 'AI…' : 'Refine with AI'}
            </button>
            <button className="desc-edit-btn" onClick={e => { e.stopPropagation(); setEditing(true) }}>Edit</button>
          </div>
        </div>
        {text ? (
          <p className="desc-text">{text}</p>
        ) : (
          <p className="desc-text desc-empty">Add a description…</p>
        )}
        {refineError && (
          <p className="desc-text" style={{ color: 'var(--coral)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            {refineError}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="desc-block desc-editing">
      <div className="desc-header">
        <span className="desc-label">Description</span>
        <button
          className="desc-edit-btn"
          onClick={handleRefine}
          disabled={refining}
          style={{ opacity: 1 }}
        >
          {refining ? 'Generating…' : 'Refine with AI'}
        </button>
      </div>
      <textarea
        ref={textareaRef}
        className="desc-textarea"
        value={text}
        onChange={handleInput}
        placeholder="Write a description or notes about this book…"
        rows={4}
      />
      {refineError && (
        <p style={{ color: 'var(--coral)', fontSize: '0.75rem', fontFamily: 'var(--mono)', marginTop: '0.5rem' }}>
          {refineError}
        </p>
      )}
      <div className="desc-actions">
        <button className="save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
      </div>
    </div>
  )
}
