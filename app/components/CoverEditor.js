'use client'

import { useRef, useState, useCallback } from 'react'

export default function CoverEditor({ bookId, initialUrl, bookTitle }) {
  const [coverUrl, setCoverUrl] = useState(initialUrl || '')
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewFile, setPreviewFile] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const fileRef = useRef(null)
  const canvasRef = useRef(null)

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setRotation(0)
    setBrightness(100)
    setContrast(100)
    setEditing(true)
  }

  async function handleUpload(file) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/books/${bookId}/cover`, { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok && data.cover_image_url) {
        setCoverUrl(data.cover_image_url + '?t=' + Date.now())
        setPreviewUrl(null)
        setPreviewFile(null)
        setEditing(false)
      }
    } catch {}
    setUploading(false)
  }

  async function handleUsePhoto() {
    if (!previewFile) return

    // If edits were made, render through canvas
    if (rotation !== 0 || brightness !== 100 || contrast !== 100) {
      const blob = await renderEditedImage()
      if (blob) {
        const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' })
        await handleUpload(file)
        return
      }
    }

    await handleUpload(previewFile)
  }

  function renderEditedImage() {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        const isRotated = rotation % 180 !== 0
        canvas.width = isRotated ? img.height : img.width
        canvas.height = isRotated ? img.width : img.height

        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((rotation * Math.PI) / 180)
        ctx.drawImage(img, -img.width / 2, -img.height / 2)

        canvas.toBlob(resolve, 'image/jpeg', 0.9)
      }
      img.onerror = () => resolve(null)
      img.src = previewUrl
    })
  }

  function handleRetake() {
    setPreviewUrl(null)
    setPreviewFile(null)
    setEditing(false)
    setRotation(0)
    setBrightness(100)
    setContrast(100)
    // Re-open file picker
    setTimeout(() => fileRef.current?.click(), 100)
  }

  function handleCancel() {
    setPreviewUrl(null)
    setPreviewFile(null)
    setEditing(false)
    setRotation(0)
    setBrightness(100)
    setContrast(100)
  }

  const hasEdits = rotation !== 0 || brightness !== 100 || contrast !== 100

  return (
    <div className="cover-editor">
      <style>{`
        .cover-editor { display: flex; flex-direction: column; align-items: center; gap: 1.2rem; }

        .cover-editor .book-cover-detail {
          position: relative;
          width: 100%;
          max-width: 280px;
          aspect-ratio: 2/3;
          border: 1px solid var(--rule);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: var(--warm-mid);
        }
        .cover-editor .book-cover-detail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .cover-placeholder {
          font-family: var(--serif);
          font-size: 1.1rem;
          font-style: italic;
          color: var(--muted);
          text-align: center;
          padding: 1rem;
          line-height: 1.3;
        }
        .cover-no-image {
          position: absolute;
          bottom: 1rem;
          font-family: var(--mono);
          font-size: 0.55rem;
          color: var(--rule);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .cover-hover-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
          cursor: pointer;
        }
        .book-cover-detail:hover .cover-hover-overlay { opacity: 1; }
        .cover-hover-text {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #fff;
        }

        /* ── EDIT MODE ── */
        .edit-preview {
          width: 100%;
          max-width: 280px;
          aspect-ratio: 2/3;
          border: 1px solid var(--coral);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--warm-mid);
        }
        .edit-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .edit-controls {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          width: 100%;
          max-width: 280px;
        }

        .edit-slider-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .edit-slider-label {
          font-family: var(--mono);
          font-size: 0.55rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          min-width: 70px;
        }
        .edit-slider {
          flex: 1;
          -webkit-appearance: none;
          appearance: none;
          height: 1px;
          background: var(--rule);
          outline: none;
        }
        .edit-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--coral);
          cursor: pointer;
        }
        .edit-slider-val {
          font-family: var(--mono);
          font-size: 0.55rem;
          color: var(--muted);
          min-width: 28px;
          text-align: right;
        }

        .edit-actions {
          display: flex;
          gap: 0.6rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .ce-btn {
          font-family: var(--mono);
          font-size: 0.58rem;
          font-weight: 400;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.5rem 1rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .ce-btn-primary {
          color: var(--ink);
          background: var(--coral);
          border: none;
        }
        .ce-btn-primary:hover { opacity: 0.85; }
        .ce-btn-primary:disabled { opacity: 0.4; cursor: default; }
        .ce-btn-secondary {
          color: var(--muted);
          background: transparent;
          border: 1px solid var(--rule);
        }
        .ce-btn-secondary:hover { border-color: var(--coral); color: var(--coral); }
        .ce-btn-ghost {
          color: var(--muted);
          background: transparent;
          border: none;
          padding: 0.5rem 0.5rem;
        }
        .ce-btn-ghost:hover { color: var(--ink); }
        .ce-btn-rotate {
          color: var(--muted);
          background: transparent;
          border: 1px solid var(--rule);
          padding: 0.45rem 0.7rem;
          font-size: 0.85rem;
          line-height: 1;
        }
        .ce-btn-rotate:hover { border-color: var(--coral); color: var(--coral); }

        .upload-status {
          font-family: var(--mono);
          font-size: 0.6rem;
          color: var(--coral);
          letter-spacing: 0.06em;
        }
      `}</style>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {editing && previewUrl ? (
        <>
          {/* Preview with edits applied via CSS */}
          <div className="edit-preview">
            <img
              src={previewUrl}
              alt="Preview"
              style={{
                transform: `rotate(${rotation}deg)`,
                filter: `brightness(${brightness}%) contrast(${contrast}%)`,
              }}
            />
          </div>

          {/* Edit controls */}
          <div className="edit-controls">
            <div className="edit-slider-row">
              <span className="edit-slider-label">Brightness</span>
              <input
                type="range"
                className="edit-slider"
                min="50" max="150" value={brightness}
                onChange={e => setBrightness(Number(e.target.value))}
              />
              <span className="edit-slider-val">{brightness}%</span>
            </div>
            <div className="edit-slider-row">
              <span className="edit-slider-label">Contrast</span>
              <input
                type="range"
                className="edit-slider"
                min="50" max="150" value={contrast}
                onChange={e => setContrast(Number(e.target.value))}
              />
              <span className="edit-slider-val">{contrast}%</span>
            </div>
          </div>

          <div className="edit-actions">
            <button className="ce-btn ce-btn-rotate" onClick={() => setRotation(r => (r + 90) % 360)} title="Rotate">
              ↻
            </button>
            <button className="ce-btn ce-btn-primary" onClick={handleUsePhoto} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Use Photo'}
            </button>
            <button className="ce-btn ce-btn-secondary" onClick={handleRetake}>
              Retake
            </button>
            <button className="ce-btn ce-btn-ghost" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Normal cover display with hover-to-change */}
          <div className="book-cover-detail" onClick={() => fileRef.current?.click()}>
            {coverUrl ? (
              <img src={coverUrl} alt={bookTitle} />
            ) : (
              <>
                <span className="cover-placeholder">{bookTitle}</span>
                <span className="cover-no-image">No cover image</span>
              </>
            )}
            <div className="cover-hover-overlay">
              <span className="cover-hover-text">{coverUrl ? 'Change Cover' : 'Add Cover'}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
