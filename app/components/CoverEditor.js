'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Cropper from 'react-easy-crop'

const MAX_IMAGES = 4

function getCroppedImg(imageSrc, pixelCrop, rotation = 0, brightness = 100, contrast = 100) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const rad = (rotation * Math.PI) / 180
      const sin = Math.abs(Math.sin(rad))
      const cos = Math.abs(Math.cos(rad))
      const rotW = img.width * cos + img.height * sin
      const rotH = img.width * sin + img.height * cos

      const tmp = document.createElement('canvas')
      tmp.width = rotW
      tmp.height = rotH
      const tCtx = tmp.getContext('2d')
      tCtx.filter = `brightness(${brightness}%) contrast(${contrast}%)`
      tCtx.translate(rotW / 2, rotH / 2)
      tCtx.rotate(rad)
      tCtx.drawImage(img, -img.width / 2, -img.height / 2)

      const canvas = document.createElement('canvas')
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(tmp, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
      canvas.toBlob(resolve, 'image/jpeg', 0.92)
    }
    img.onerror = () => resolve(null)
    img.src = imageSrc
  })
}

export default function CoverEditor({ bookId, initialUrl, bookTitle }) {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Crop state
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)

  const cameraRef = useRef(null)
  const uploadRef = useRef(null)

  // Load existing images
  useEffect(() => {
    fetch(`/api/books/${bookId}/images`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setImages(data)
        setLoading(false)
      })
      .catch(() => {
        // Fallback: if book_images table doesn't exist yet, use cover_image_url
        if (initialUrl) {
          setImages([{ id: 'legacy', image_url: initialUrl, is_cover: true }])
        }
        setLoading(false)
      })
  }, [bookId, initialUrl])

  const onCropComplete = useCallback((_, px) => setCroppedAreaPixels(px), [])

  const coverUrl = images.find(i => i.is_cover)?.image_url || images[0]?.image_url || initialUrl || ''

  function resetEdits() {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setBrightness(100)
    setContrast(100)
    setCroppedAreaPixels(null)
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    resetEdits()
    setEditing(true)
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  async function handleSave() {
    if (!previewUrl || !croppedAreaPixels) return
    setUploading(true)
    try {
      const blob = await getCroppedImg(previewUrl, croppedAreaPixels, rotation, brightness, contrast)
      if (blob) {
        const fd = new FormData()
        fd.append('file', new File([blob], 'cover.jpg', { type: 'image/jpeg' }))
        const res = await fetch(`/api/books/${bookId}/images`, { method: 'POST', body: fd })
        if (res.ok) {
          const img = await res.json()
          setImages(prev => [...prev, img])
          setPreviewUrl(null)
          setEditing(false)
        } else {
          const err = await res.json()
          alert(err.error || 'Upload failed')
        }
      }
    } catch {}
    setUploading(false)
  }

  async function handleDelete(imageId) {
    if (!confirm('Delete this photo?')) return
    const res = await fetch(`/api/books/${bookId}/images`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_id: imageId }),
    })
    if (res.ok) {
      setImages(prev => prev.filter(i => i.id !== imageId))
      if (activeIndex >= images.length - 1) setActiveIndex(Math.max(0, images.length - 2))
    }
  }

  function handleRetake() {
    setPreviewUrl(null)
    setEditing(false)
    resetEdits()
    setTimeout(() => cameraRef.current?.click(), 100)
  }

  function handleCancel() {
    setPreviewUrl(null)
    setEditing(false)
    resetEdits()
  }

  const canAdd = images.length < MAX_IMAGES

  return (
    <div className="cover-editor">
      <style>{`
        .cover-editor {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          width: 100%;
        }

        /* ── MAIN IMAGE ── */
        .ce-main-image {
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
        .ce-main-image img {
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

        /* ── THUMBNAILS ── */
        .ce-thumbs {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
        }
        .ce-thumb {
          width: 48px;
          height: 64px;
          border: 1px solid var(--rule);
          overflow: hidden;
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.15s, border-color 0.15s;
          position: relative;
          flex-shrink: 0;
        }
        .ce-thumb.active {
          opacity: 1;
          border-color: var(--coral);
        }
        .ce-thumb:hover { opacity: 1; }
        .ce-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .ce-thumb-delete {
          position: absolute;
          top: 1px;
          right: 1px;
          width: 14px;
          height: 14px;
          background: rgba(0,0,0,0.6);
          color: #fff;
          font-size: 9px;
          line-height: 14px;
          text-align: center;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.15s;
          border: none;
          padding: 0;
        }
        .ce-thumb:hover .ce-thumb-delete { opacity: 1; }

        .ce-add-thumb {
          width: 48px;
          height: 64px;
          border: 1px dashed var(--rule);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
          background: transparent;
          color: var(--muted);
          font-size: 1.1rem;
          padding: 0;
          flex-shrink: 0;
        }
        .ce-add-thumb:hover { border-color: var(--coral); color: var(--coral); }

        /* ── ADD BUTTONS ── */
        .ce-add-buttons {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }

        /* ── CROP AREA ── */
        .crop-container {
          position: relative;
          width: 100%;
          max-width: 320px;
          aspect-ratio: 2/3;
          border: 1px solid var(--coral);
          overflow: hidden;
          background: #000;
        }
        .crop-container .reactEasyCrop_CropArea {
          border: 2px solid var(--coral) !important;
        }

        .edit-controls {
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
          width: 100%;
          max-width: 320px;
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
          min-width: 32px;
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

        .ce-count {
          font-family: var(--mono);
          font-size: 0.55rem;
          color: var(--muted);
          letter-spacing: 0.08em;
          text-align: center;
        }
      `}</style>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileSelect} />
      <input ref={uploadRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />

      {editing && previewUrl ? (
        <>
          <div className="crop-container">
            <Cropper
              image={previewUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={2 / 3}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{
                mediaStyle: { filter: `brightness(${brightness}%) contrast(${contrast}%)` },
              }}
            />
          </div>

          <div className="edit-controls">
            <div className="edit-slider-row">
              <span className="edit-slider-label">Zoom</span>
              <input type="range" className="edit-slider" min="1" max="3" step="0.05" value={zoom} onChange={e => setZoom(Number(e.target.value))} />
              <span className="edit-slider-val">{zoom.toFixed(1)}x</span>
            </div>
            <div className="edit-slider-row">
              <span className="edit-slider-label">Brightness</span>
              <input type="range" className="edit-slider" min="50" max="150" value={brightness} onChange={e => setBrightness(Number(e.target.value))} />
              <span className="edit-slider-val">{brightness}%</span>
            </div>
            <div className="edit-slider-row">
              <span className="edit-slider-label">Contrast</span>
              <input type="range" className="edit-slider" min="50" max="150" value={contrast} onChange={e => setContrast(Number(e.target.value))} />
              <span className="edit-slider-val">{contrast}%</span>
            </div>
          </div>

          <div className="edit-actions">
            <button className="ce-btn ce-btn-rotate" onClick={() => setRotation(r => (r + 90) % 360)} title="Rotate">↻</button>
            <button className="ce-btn ce-btn-primary" onClick={handleSave} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Save'}
            </button>
            <button className="ce-btn ce-btn-secondary" onClick={handleRetake}>Retake</button>
            <button className="ce-btn ce-btn-ghost" onClick={handleCancel}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          {/* Main display image */}
          <div className="ce-main-image">
            {images.length > 0 ? (
              <img src={images[activeIndex]?.image_url || coverUrl} alt={bookTitle} />
            ) : coverUrl ? (
              <img src={coverUrl} alt={bookTitle} />
            ) : (
              <>
                <span className="cover-placeholder">{bookTitle}</span>
                <span className="cover-no-image">No cover image</span>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {(images.length > 0 || canAdd) && (
            <div className="ce-thumbs">
              {images.map((img, i) => (
                <div
                  key={img.id}
                  className={`ce-thumb${i === activeIndex ? ' active' : ''}`}
                  onClick={() => setActiveIndex(i)}
                >
                  <img src={img.image_url} alt="" />
                  {img.id !== 'legacy' && (
                    <button className="ce-thumb-delete" onClick={e => { e.stopPropagation(); handleDelete(img.id) }}>×</button>
                  )}
                </div>
              ))}
              {canAdd && (
                <button className="ce-add-thumb" onClick={() => {}} title="Add photo">+</button>
              )}
            </div>
          )}

          {/* Add buttons */}
          {canAdd && (
            <div className="ce-add-buttons">
              <button className="ce-btn ce-btn-secondary" onClick={() => cameraRef.current?.click()}>
                Take Photo
              </button>
              <button className="ce-btn ce-btn-secondary" onClick={() => uploadRef.current?.click()}>
                Upload Photo
              </button>
            </div>
          )}

          {images.length > 0 && (
            <div className="ce-count">{images.length} / {MAX_IMAGES} photos</div>
          )}
        </>
      )}
    </div>
  )
}
