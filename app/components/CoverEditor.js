'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import ScanTool from './ScanTool'

const MAX_IMAGES = 4

function getCroppedImg(imageSrc, cropBox, imgDims, rotation = 0, brightness = 100, contrast = 100) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // Scale crop coordinates from display size to actual image size
      const scaleX = img.width / imgDims.width
      const scaleY = img.height / imgDims.height
      const sx = cropBox.x * scaleX
      const sy = cropBox.y * scaleY
      const sw = cropBox.width * scaleX
      const sh = cropBox.height * scaleY

      // Apply rotation to source
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

      // Recalculate scale after rotation
      const rotScaleX = tmp.width / imgDims.width
      const rotScaleY = tmp.height / imgDims.height
      const rsx = cropBox.x * rotScaleX
      const rsy = cropBox.y * rotScaleY
      const rsw = cropBox.width * rotScaleX
      const rsh = cropBox.height * rotScaleY

      const canvas = document.createElement('canvas')
      canvas.width = rsw
      canvas.height = rsh
      const ctx = canvas.getContext('2d')
      ctx.drawImage(tmp, rsx, rsy, rsw, rsh, 0, 0, rsw, rsh)
      canvas.toBlob(resolve, 'image/jpeg', 0.92)
    }
    img.onerror = () => resolve(null)
    img.src = imageSrc
  })
}

// ── Drag-to-crop component ──
function CropTool({ src, rotation, brightness, contrast, onCropChange }) {
  const containerRef = useRef(null)
  const [imgDims, setImgDims] = useState({ width: 0, height: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragType, setDragType] = useState(null) // 'create' | 'move' | 'nw' | 'ne' | 'sw' | 'se'
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [cropBox, setCropBox] = useState(null)
  const [startCrop, setStartCrop] = useState(null)

  // Initialize crop to full image on load
  function handleImgLoad(e) {
    const w = e.target.clientWidth
    const h = e.target.clientHeight
    setImgDims({ width: w, height: h })
    // Default crop: centered, 80% of image
    const margin = 0.1
    const box = {
      x: w * margin,
      y: h * margin,
      width: w * (1 - 2 * margin),
      height: h * (1 - 2 * margin),
    }
    setCropBox(box)
    onCropChange(box, { width: w, height: h })
  }

  function getPos(e) {
    const rect = containerRef.current.getBoundingClientRect()
    const touch = e.touches?.[0]
    return {
      x: (touch?.clientX ?? e.clientX) - rect.left,
      y: (touch?.clientY ?? e.clientY) - rect.top,
    }
  }

  function getHandleAt(pos) {
    if (!cropBox) return null
    const hs = 16 // handle size
    const { x, y, width, height } = cropBox
    if (Math.abs(pos.x - x) < hs && Math.abs(pos.y - y) < hs) return 'nw'
    if (Math.abs(pos.x - (x + width)) < hs && Math.abs(pos.y - y) < hs) return 'ne'
    if (Math.abs(pos.x - x) < hs && Math.abs(pos.y - (y + height)) < hs) return 'sw'
    if (Math.abs(pos.x - (x + width)) < hs && Math.abs(pos.y - (y + height)) < hs) return 'se'
    if (pos.x > x && pos.x < x + width && pos.y > y && pos.y < y + height) return 'move'
    return 'create'
  }

  function handleStart(e) {
    e.preventDefault()
    const pos = getPos(e)
    const handle = getHandleAt(pos)
    setDragging(true)
    setDragType(handle)
    setStartPos(pos)
    setStartCrop(cropBox ? { ...cropBox } : null)
  }

  function handleMove(e) {
    if (!dragging) return
    e.preventDefault()
    const pos = getPos(e)
    const dx = pos.x - startPos.x
    const dy = pos.y - startPos.y

    let newBox
    if (dragType === 'create') {
      newBox = {
        x: Math.min(startPos.x, pos.x),
        y: Math.min(startPos.y, pos.y),
        width: Math.abs(dx),
        height: Math.abs(dy),
      }
    } else if (dragType === 'move' && startCrop) {
      newBox = {
        ...startCrop,
        x: Math.max(0, Math.min(startCrop.x + dx, imgDims.width - startCrop.width)),
        y: Math.max(0, Math.min(startCrop.y + dy, imgDims.height - startCrop.height)),
      }
    } else if (startCrop) {
      newBox = { ...startCrop }
      if (dragType === 'se') {
        newBox.width = Math.max(30, startCrop.width + dx)
        newBox.height = Math.max(30, startCrop.height + dy)
      } else if (dragType === 'sw') {
        newBox.x = startCrop.x + dx
        newBox.width = Math.max(30, startCrop.width - dx)
        newBox.height = Math.max(30, startCrop.height + dy)
      } else if (dragType === 'ne') {
        newBox.y = startCrop.y + dy
        newBox.width = Math.max(30, startCrop.width + dx)
        newBox.height = Math.max(30, startCrop.height - dy)
      } else if (dragType === 'nw') {
        newBox.x = startCrop.x + dx
        newBox.y = startCrop.y + dy
        newBox.width = Math.max(30, startCrop.width - dx)
        newBox.height = Math.max(30, startCrop.height - dy)
      }
    }

    if (newBox) {
      // Clamp to image bounds
      newBox.x = Math.max(0, newBox.x)
      newBox.y = Math.max(0, newBox.y)
      newBox.width = Math.min(newBox.width, imgDims.width - newBox.x)
      newBox.height = Math.min(newBox.height, imgDims.height - newBox.y)
      setCropBox(newBox)
      onCropChange(newBox, imgDims)
    }
  }

  function handleEnd() {
    setDragging(false)
    setDragType(null)
  }

  return (
    <div
      ref={containerRef}
      className="crop-tool"
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    >
      <img
        src={src}
        alt="Crop"
        className="crop-img"
        onLoad={handleImgLoad}
        draggable={false}
        style={{
          transform: `rotate(${rotation}deg)`,
          filter: `brightness(${brightness}%) contrast(${contrast}%)`,
        }}
      />
      {/* Dark overlay outside crop */}
      {cropBox && imgDims.width > 0 && (
        <>
          <div className="crop-overlay" style={{ top: 0, left: 0, right: 0, height: cropBox.y }} />
          <div className="crop-overlay" style={{ top: cropBox.y + cropBox.height, left: 0, right: 0, bottom: 0 }} />
          <div className="crop-overlay" style={{ top: cropBox.y, left: 0, width: cropBox.x, height: cropBox.height }} />
          <div className="crop-overlay" style={{ top: cropBox.y, left: cropBox.x + cropBox.width, right: 0, height: cropBox.height }} />
          {/* Crop border */}
          <div className="crop-border" style={{ left: cropBox.x, top: cropBox.y, width: cropBox.width, height: cropBox.height }}>
            {/* Grid lines */}
            <div className="crop-grid-h" style={{ top: '33.33%' }} />
            <div className="crop-grid-h" style={{ top: '66.66%' }} />
            <div className="crop-grid-v" style={{ left: '33.33%' }} />
            <div className="crop-grid-v" style={{ left: '66.66%' }} />
            {/* Corner handles */}
            <div className="crop-handle nw" />
            <div className="crop-handle ne" />
            <div className="crop-handle sw" />
            <div className="crop-handle se" />
          </div>
        </>
      )}
    </div>
  )
}

export default function CoverEditor({ bookId, initialUrl, bookTitle, canEdit = true }) {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanSrc, setScanSrc] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Crop + adjustment state
  const [cropData, setCropData] = useState(null)
  const [imgDims, setImgDims] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)

  const cameraRef = useRef(null)
  const uploadRef = useRef(null)
  const scanCameraRef = useRef(null)

  useEffect(() => {
    fetch(`/api/books/${bookId}/images`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setImages(data)
        setLoading(false)
      })
      .catch(() => {
        if (initialUrl) setImages([{ id: 'legacy', image_url: initialUrl, is_cover: true }])
        setLoading(false)
      })
  }, [bookId, initialUrl])

  const coverUrl = images.find(i => i.is_cover)?.image_url || images[0]?.image_url || initialUrl || ''

  function resetEdits() {
    setCropData(null)
    setImgDims(null)
    setRotation(0)
    setBrightness(100)
    setContrast(100)
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    resetEdits()
    setEditing(true)
    e.target.value = ''
  }

  function handleScanFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanSrc(URL.createObjectURL(file))
    setScanning(true)
    e.target.value = ''
  }

  function handleScanComplete(correctedUrl) {
    setScanning(false)
    setScanSrc(null)
    setPreviewUrl(correctedUrl)
    resetEdits()
    setEditing(true)
  }

  function handleScanCancel() {
    setScanning(false)
    setScanSrc(null)
  }

  function handleCropChange(box, dims) {
    setCropData(box)
    setImgDims(dims)
  }

  async function handleSave() {
    if (!previewUrl || !cropData || !imgDims) return
    setUploading(true)
    try {
      const blob = await getCroppedImg(previewUrl, cropData, imgDims, rotation, brightness, contrast)
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

  const canAdd = canEdit && images.length < MAX_IMAGES

  return (
    <div className="cover-editor">
      <style>{`
        .cover-editor {
          display: flex; flex-direction: column; align-items: center;
          gap: 1rem; width: 100%;
        }

        .ce-main-image {
          position: relative; width: 100%; max-width: 280px;
          border: 1px solid var(--rule);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; background: var(--warm-mid);
        }
        .ce-main-image img { width: 100%; height: auto; object-fit: contain; display: block; }

        .ce-main-image:not(:has(img)) { min-height: 200px; }
        .cover-placeholder {
          font-family: var(--serif); font-size: 1.1rem; font-style: italic;
          color: var(--muted); text-align: center; padding: 1rem; line-height: 1.3;
        }
        .cover-no-image {
          position: absolute; bottom: 1rem;
          font-family: var(--mono); font-size: 0.55rem; color: var(--rule);
          letter-spacing: 0.1em; text-transform: uppercase;
        }

        .cover-hover-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.2s; cursor: pointer;
        }
        .ce-main-image:hover .cover-hover-overlay { opacity: 1; }
        .cover-hover-text {
          font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.12em;
          text-transform: uppercase; color: #fff;
        }

        /* ── CROP TOOL ── */
        .crop-tool {
          position: relative; width: 100%; max-width: 320px;
          cursor: crosshair; user-select: none; touch-action: none;
          border: 1px solid var(--rule); background: #000;
        }
        .crop-img {
          width: 100%; display: block;
        }
        .crop-overlay {
          position: absolute; background: rgba(0,0,0,0.55); pointer-events: none;
        }
        .crop-border {
          position: absolute; border: 2px solid var(--coral);
          pointer-events: none; box-sizing: border-box;
        }
        .crop-grid-h {
          position: absolute; left: 0; right: 0; height: 1px;
          background: rgba(255,255,255,0.2);
        }
        .crop-grid-v {
          position: absolute; top: 0; bottom: 0; width: 1px;
          background: rgba(255,255,255,0.2);
        }
        .crop-handle {
          position: absolute; width: 16px; height: 16px;
          border: 2px solid #fff; background: var(--coral);
          pointer-events: auto; cursor: nwse-resize;
        }
        .crop-handle.nw { top: -4px; left: -4px; cursor: nwse-resize; }
        .crop-handle.ne { top: -4px; right: -4px; cursor: nesw-resize; }
        .crop-handle.sw { bottom: -4px; left: -4px; cursor: nesw-resize; }
        .crop-handle.se { bottom: -4px; right: -4px; cursor: nwse-resize; }

        /* ── THUMBNAILS ── */
        .ce-thumbs {
          display: flex; gap: 0.5rem; align-items: center;
          justify-content: center; flex-wrap: wrap;
        }
        .ce-thumb {
          width: 48px; height: 64px; border: 1px solid var(--rule);
          overflow: hidden; cursor: pointer; opacity: 0.6;
          transition: opacity 0.15s, border-color 0.15s;
          position: relative; flex-shrink: 0;
        }
        .ce-thumb.active { opacity: 1; border-color: var(--coral); }
        .ce-thumb:hover { opacity: 1; }
        .ce-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .ce-thumb-delete {
          position: absolute; top: 1px; right: 1px;
          width: 14px; height: 14px; background: rgba(0,0,0,0.6);
          color: #fff; font-size: 9px; line-height: 14px; text-align: center;
          cursor: pointer; opacity: 0; transition: opacity 0.15s;
          border: none; padding: 0;
        }
        .ce-thumb:hover .ce-thumb-delete { opacity: 1; }

        .ce-add-thumb {
          width: 48px; height: 64px; border: 1px dashed var(--rule);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: border-color 0.15s, color 0.15s;
          background: transparent; color: var(--muted); font-size: 1.1rem;
          padding: 0; flex-shrink: 0;
        }
        .ce-add-thumb:hover { border-color: var(--coral); color: var(--coral); }

        .ce-add-buttons { display: flex; gap: 0.5rem; justify-content: center; }

        /* ── EDIT CONTROLS ── */
        .edit-controls {
          display: flex; flex-direction: column; gap: 0.7rem;
          width: 100%; max-width: 320px;
        }
        .edit-slider-row { display: flex; align-items: center; gap: 0.75rem; }
        .edit-slider-label {
          font-family: var(--mono); font-size: 0.55rem; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--muted); min-width: 70px;
        }
        .edit-slider {
          flex: 1; -webkit-appearance: none; appearance: none;
          height: 1px; background: var(--rule); outline: none;
        }
        .edit-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 12px; height: 12px;
          border-radius: 50%; background: var(--coral); cursor: pointer;
        }
        .edit-slider-val {
          font-family: var(--mono); font-size: 0.55rem; color: var(--muted);
          min-width: 32px; text-align: right;
        }

        .edit-actions {
          display: flex; gap: 0.6rem; flex-wrap: wrap; justify-content: center;
        }

        .ce-btn {
          font-family: var(--mono); font-size: 0.58rem; font-weight: 400;
          letter-spacing: 0.08em; text-transform: uppercase;
          padding: 0.5rem 1rem; cursor: pointer; transition: all 0.15s;
        }
        .ce-btn-primary { color: var(--ink); background: var(--coral); border: none; }
        .ce-btn-primary:hover { opacity: 0.85; }
        .ce-btn-primary:disabled { opacity: 0.4; cursor: default; }
        .ce-btn-secondary {
          color: var(--muted); background: transparent; border: 1px solid var(--rule);
        }
        .ce-btn-secondary:hover { border-color: var(--coral); color: var(--coral); }
        .ce-btn-ghost {
          color: var(--muted); background: transparent; border: none; padding: 0.5rem;
        }
        .ce-btn-ghost:hover { color: var(--ink); }
        .ce-btn-rotate {
          color: var(--muted); background: transparent; border: 1px solid var(--rule);
          padding: 0.45rem 0.7rem; font-size: 0.85rem; line-height: 1;
        }
        .ce-btn-rotate:hover { border-color: var(--coral); color: var(--coral); }

        .ce-count {
          font-family: var(--mono); font-size: 0.55rem; color: var(--muted);
          letter-spacing: 0.08em; text-align: center;
        }
      `}</style>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileSelect} />
      <input ref={uploadRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />
      <input ref={scanCameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleScanFileSelect} />

      {scanning && scanSrc ? (
        <ScanTool
          imageSrc={scanSrc}
          onComplete={handleScanComplete}
          onCancel={handleScanCancel}
        />
      ) : editing && previewUrl ? (
        <>
          <CropTool
            src={previewUrl}
            rotation={rotation}
            brightness={brightness}
            contrast={contrast}
            onCropChange={handleCropChange}
          />

          <div className="edit-controls">
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
          <div className="ce-main-image" onClick={() => { if (canAdd) uploadRef.current?.click() }}>
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
            {canAdd && (
              <div className="cover-hover-overlay">
                <span className="cover-hover-text">{coverUrl ? 'Add Photo' : 'Add Cover'}</span>
              </div>
            )}
          </div>

          {(images.length > 0 || canAdd) && (
            <div className="ce-thumbs">
              {images.map((img, i) => (
                <div key={img.id} className={`ce-thumb${i === activeIndex ? ' active' : ''}`} onClick={() => setActiveIndex(i)}>
                  <img src={img.image_url} alt="" />
                  {canEdit && img.id !== 'legacy' && (
                    <button className="ce-thumb-delete" onClick={e => { e.stopPropagation(); handleDelete(img.id) }}>×</button>
                  )}
                </div>
              ))}
              {canAdd && (
                <button className="ce-add-thumb" onClick={() => {}} title="Add photo">+</button>
              )}
            </div>
          )}

          {canAdd && (
            <div className="ce-add-buttons">
              <button className="ce-btn ce-btn-secondary" onClick={() => cameraRef.current?.click()}>Take Photo</button>
              <button className="ce-btn ce-btn-secondary" onClick={() => uploadRef.current?.click()}>Upload Photo</button>
              <button className="ce-btn ce-btn-primary" onClick={() => scanCameraRef.current?.click()}>Scan Cover</button>
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
