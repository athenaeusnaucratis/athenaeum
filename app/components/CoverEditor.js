'use client'

import { useRef, useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'

// Utility: get cropped image blob from canvas
function getCroppedImg(imageSrc, pixelCrop, rotation = 0, brightness = 100, contrast = 100) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // Handle rotation
      const rad = (rotation * Math.PI) / 180
      const sin = Math.abs(Math.sin(rad))
      const cos = Math.abs(Math.cos(rad))
      const rotW = img.width * cos + img.height * sin
      const rotH = img.width * sin + img.height * cos

      // Temp canvas for rotation + filters
      const tmpCanvas = document.createElement('canvas')
      tmpCanvas.width = rotW
      tmpCanvas.height = rotH
      const tmpCtx = tmpCanvas.getContext('2d')
      tmpCtx.filter = `brightness(${brightness}%) contrast(${contrast}%)`
      tmpCtx.translate(rotW / 2, rotH / 2)
      tmpCtx.rotate(rad)
      tmpCtx.drawImage(img, -img.width / 2, -img.height / 2)

      // Crop from the rotated+filtered image
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height
      ctx.drawImage(
        tmpCanvas,
        pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
        0, 0, pixelCrop.width, pixelCrop.height
      )

      canvas.toBlob(resolve, 'image/jpeg', 0.92)
    }
    img.onerror = () => resolve(null)
    img.src = imageSrc
  })
}

export default function CoverEditor({ bookId, initialUrl, bookTitle }) {
  const [coverUrl, setCoverUrl] = useState(initialUrl || '')
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewFile, setPreviewFile] = useState(null)

  // Crop state
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  // Adjustments
  const [rotation, setRotation] = useState(0)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)

  const fileRef = useRef(null)

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

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
    setPreviewFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    resetEdits()
    setEditing(true)
  }

  async function handleUpload() {
    if (!previewUrl || !croppedAreaPixels) return
    setUploading(true)
    try {
      const blob = await getCroppedImg(previewUrl, croppedAreaPixels, rotation, brightness, contrast)
      if (blob) {
        const fd = new FormData()
        fd.append('file', new File([blob], 'cover.jpg', { type: 'image/jpeg' }))
        const res = await fetch(`/api/books/${bookId}/cover`, { method: 'POST', body: fd })
        const data = await res.json()
        if (res.ok && data.cover_image_url) {
          setCoverUrl(data.cover_image_url + '?t=' + Date.now())
          setPreviewUrl(null)
          setPreviewFile(null)
          setEditing(false)
        }
      }
    } catch {}
    setUploading(false)
  }

  function handleRetake() {
    setPreviewUrl(null)
    setPreviewFile(null)
    setEditing(false)
    resetEdits()
    setTimeout(() => fileRef.current?.click(), 100)
  }

  function handleCancel() {
    setPreviewUrl(null)
    setPreviewFile(null)
    setEditing(false)
    resetEdits()
  }

  return (
    <div className="cover-editor">
      <style>{`
        .cover-editor {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.2rem;
          width: 100%;
        }

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
          cursor: pointer;
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
        }
        .book-cover-detail:hover .cover-hover-overlay { opacity: 1; }
        .cover-hover-text {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #fff;
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

        /* Override react-easy-crop styles for dark theme */
        .crop-container .reactEasyCrop_CropArea {
          border: 2px solid var(--coral) !important;
          color: rgba(0,0,0,0.6) !important;
        }

        /* ── EDIT CONTROLS ── */
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
      `}</style>

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
          {/* Cropper */}
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
                mediaStyle: {
                  filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                },
              }}
            />
          </div>

          {/* Controls */}
          <div className="edit-controls">
            <div className="edit-slider-row">
              <span className="edit-slider-label">Zoom</span>
              <input
                type="range" className="edit-slider"
                min="1" max="3" step="0.05" value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
              />
              <span className="edit-slider-val">{zoom.toFixed(1)}x</span>
            </div>
            <div className="edit-slider-row">
              <span className="edit-slider-label">Brightness</span>
              <input
                type="range" className="edit-slider"
                min="50" max="150" value={brightness}
                onChange={e => setBrightness(Number(e.target.value))}
              />
              <span className="edit-slider-val">{brightness}%</span>
            </div>
            <div className="edit-slider-row">
              <span className="edit-slider-label">Contrast</span>
              <input
                type="range" className="edit-slider"
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
            <button className="ce-btn ce-btn-primary" onClick={handleUpload} disabled={uploading}>
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
      )}
    </div>
  )
}
