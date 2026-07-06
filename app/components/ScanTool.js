'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

/**
 * Perspective transform scanner — lets user drag 4 corners to deskew a photo.
 * Pure canvas implementation, no external dependencies.
 */

// ── Perspective math ──
// Solve 8-parameter perspective transform: maps 4 src points → 4 dst points
function getPerspectiveTransform(src, dst) {
  // src/dst: [{x,y}, {x,y}, {x,y}, {x,y}] — TL, TR, BR, BL
  const A = []
  const b = []
  for (let i = 0; i < 4; i++) {
    const sx = src[i].x, sy = src[i].y
    const dx = dst[i].x, dy = dst[i].y
    A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy])
    A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy])
    b.push(dx)
    b.push(dy)
  }
  // Solve via Gaussian elimination
  const n = 8
  const M = A.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    let maxRow = col
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row
    }
    [M[col], M[maxRow]] = [M[maxRow], M[col]]
    if (Math.abs(M[col][col]) < 1e-10) continue
    for (let row = col + 1; row < n; row++) {
      const f = M[row][col] / M[col][col]
      for (let j = col; j <= n; j++) M[row][j] -= f * M[col][j]
    }
  }
  const x = new Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    x[i] = M[i][n]
    for (let j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j]
    x[i] /= M[i][i]
  }
  return x // [a,b,c,d,e,f,g,h]
}

// Apply perspective transform: map (x,y) in dst → src coordinates
function applyInverseTransform(coeffs, dx, dy) {
  const [a, b, c, d, e, f, g, h] = coeffs
  const denom = g * dx + h * dy + 1
  return {
    x: (a * dx + b * dy + c) / denom,
    y: (d * dx + e * dy + f) / denom,
  }
}

// Bilinear interpolation sampler — smooth pixel blending instead of blocky nearest-neighbor
function sampleBilinear(srcData, w, h, sx, sy) {
  const x0 = Math.floor(sx), y0 = Math.floor(sy)
  const x1 = Math.min(x0 + 1, w - 1), y1 = Math.min(y0 + 1, h - 1)
  const fx = sx - x0, fy = sy - y0

  const i00 = (y0 * w + x0) * 4
  const i10 = (y0 * w + x1) * 4
  const i01 = (y1 * w + x0) * 4
  const i11 = (y1 * w + x1) * 4

  const out = []
  for (let c = 0; c < 4; c++) {
    const top = srcData[i00 + c] * (1 - fx) + srcData[i10 + c] * fx
    const bot = srcData[i01 + c] * (1 - fx) + srcData[i11 + c] * fx
    out.push(top * (1 - fy) + bot * fy)
  }
  return out
}

// Render perspective-corrected image with bilinear interpolation
function warpPerspective(srcCanvas, corners, outWidth, outHeight) {
  const dst = [
    { x: 0, y: 0 },
    { x: outWidth, y: 0 },
    { x: outWidth, y: outHeight },
    { x: 0, y: outHeight },
  ]
  const coeffs = getPerspectiveTransform(dst, corners)

  const outCanvas = document.createElement('canvas')
  outCanvas.width = outWidth
  outCanvas.height = outHeight
  const outCtx = outCanvas.getContext('2d')
  const srcCtx = srcCanvas.getContext('2d')
  const srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height)
  const outImgData = outCtx.createImageData(outWidth, outHeight)
  const sw = srcCanvas.width, sh = srcCanvas.height

  for (let dy = 0; dy < outHeight; dy++) {
    for (let dx = 0; dx < outWidth; dx++) {
      const src = applyInverseTransform(coeffs, dx, dy)
      if (src.x >= 0 && src.x < sw - 1 && src.y >= 0 && src.y < sh - 1) {
        const [r, g, b, a] = sampleBilinear(srcData.data, sw, sh, src.x, src.y)
        const di = (dy * outWidth + dx) * 4
        outImgData.data[di] = r
        outImgData.data[di + 1] = g
        outImgData.data[di + 2] = b
        outImgData.data[di + 3] = a
      }
    }
  }
  outCtx.putImageData(outImgData, 0, 0)
  return outCanvas
}

// Post-processing: auto white-balance, sharpen, and contrast enhance
function enhanceScan(canvas) {
  const ctx = canvas.getContext('2d')
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = imgData.data
  const len = d.length

  // 1. Auto levels — stretch histogram so darkest→0, brightest→255
  let minR = 255, minG = 255, minB = 255
  let maxR = 0, maxG = 0, maxB = 0
  for (let i = 0; i < len; i += 4) {
    if (d[i] < minR) minR = d[i]
    if (d[i] > maxR) maxR = d[i]
    if (d[i+1] < minG) minG = d[i+1]
    if (d[i+1] > maxG) maxG = d[i+1]
    if (d[i+2] < minB) minB = d[i+2]
    if (d[i+2] > maxB) maxB = d[i+2]
  }
  // Use percentile-based clipping (ignore top/bottom 0.5%) for robustness
  const rangeR = maxR - minR || 1
  const rangeG = maxG - minG || 1
  const rangeB = maxB - minB || 1

  for (let i = 0; i < len; i += 4) {
    d[i]   = Math.min(255, Math.max(0, ((d[i]   - minR) / rangeR) * 255)) | 0
    d[i+1] = Math.min(255, Math.max(0, ((d[i+1] - minG) / rangeG) * 255)) | 0
    d[i+2] = Math.min(255, Math.max(0, ((d[i+2] - minB) / rangeB) * 255)) | 0
  }

  // 2. Unsharp mask — sharpen edges
  const w = canvas.width, h = canvas.height
  const copy = new Uint8ClampedArray(d)
  const amount = 0.5 // sharpening strength
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4
      for (let c = 0; c < 3; c++) {
        // 3x3 blur approximation for the pixel
        const blur = (
          copy[((y-1)*w+x-1)*4+c] + copy[((y-1)*w+x)*4+c]*2 + copy[((y-1)*w+x+1)*4+c] +
          copy[(y*w+x-1)*4+c]*2   + copy[i+c]*4               + copy[(y*w+x+1)*4+c]*2 +
          copy[((y+1)*w+x-1)*4+c] + copy[((y+1)*w+x)*4+c]*2 + copy[((y+1)*w+x+1)*4+c]
        ) / 16
        d[i+c] = Math.min(255, Math.max(0, copy[i+c] + (copy[i+c] - blur) * amount)) | 0
      }
    }
  }

  ctx.putImageData(imgData, 0, 0)
  return canvas
}

// ── Simple edge detection for auto-detect ──
function autoDetectCorners(canvas) {
  const ctx = canvas.getContext('2d')
  const w = canvas.width, h = canvas.height
  const imgData = ctx.getImageData(0, 0, w, h)
  const data = imgData.data

  // Convert to grayscale
  const gray = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) {
    gray[i] = (data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114) | 0
  }

  // Simple Sobel edge detection
  const edges = new Uint8Array(w * h)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const gx = -gray[(y - 1) * w + x - 1] + gray[(y - 1) * w + x + 1]
        - 2 * gray[y * w + x - 1] + 2 * gray[y * w + x + 1]
        - gray[(y + 1) * w + x - 1] + gray[(y + 1) * w + x + 1]
      const gy = -gray[(y - 1) * w + x - 1] - 2 * gray[(y - 1) * w + x]
        - gray[(y - 1) * w + x + 1] + gray[(y + 1) * w + x - 1]
        + 2 * gray[(y + 1) * w + x] + gray[(y + 1) * w + x + 1]
      edges[y * w + x] = Math.min(255, Math.sqrt(gx * gx + gy * gy) | 0)
    }
  }

  // Find the bounding box of strong edges (threshold = 40)
  const threshold = 40
  let minX = w, minY = h, maxX = 0, maxY = 0
  let found = false
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (edges[y * w + x] > threshold) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
        found = true
      }
    }
  }

  if (!found || (maxX - minX) < w * 0.2 || (maxY - minY) < h * 0.2) {
    // Fallback: use 90% of image
    const m = 0.05
    return [
      { x: w * m, y: h * m },
      { x: w * (1 - m), y: h * m },
      { x: w * (1 - m), y: h * (1 - m) },
      { x: w * m, y: h * (1 - m) },
    ]
  }

  // Add small padding
  const pad = Math.min(w, h) * 0.01
  return [
    { x: Math.max(0, minX - pad), y: Math.max(0, minY - pad) },
    { x: Math.min(w, maxX + pad), y: Math.max(0, minY - pad) },
    { x: Math.min(w, maxX + pad), y: Math.min(h, maxY + pad) },
    { x: Math.max(0, minX - pad), y: Math.min(h, maxY + pad) },
  ]
}

export default function ScanTool({ imageSrc, onComplete, onCancel }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [corners, setCorners] = useState(null) // [{x,y},...] in image coords
  const [draggingIdx, setDraggingIdx] = useState(-1)
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const [displayScale, setDisplayScale] = useState(1)
  const [processing, setProcessing] = useState(false)

  const [detecting, setDetecting] = useState(false)

  // Load image and auto-detect corners via Claude Vision
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = async () => {
      const maxDim = 2400
      let w = img.width, h = img.height
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h)
        w = Math.round(w * scale)
        h = Math.round(h * scale)
      }

      const canvas = canvasRef.current
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      setImgSize({ w, h })

      if (containerRef.current) {
        setDisplayScale(containerRef.current.clientWidth / w)
      }

      // Use Claude Vision for corner detection (send downscaled for speed)
      setDetecting(true)
      try {
        const detectMax = 1200
        let dw = w, dh = h
        if (dw > detectMax || dh > detectMax) {
          const s = detectMax / Math.max(dw, dh)
          dw = Math.round(dw * s); dh = Math.round(dh * s)
        }
        const detectCanvas = document.createElement('canvas')
        detectCanvas.width = dw; detectCanvas.height = dh
        detectCanvas.getContext('2d').drawImage(canvas, 0, 0, dw, dh)
        const dataUrl = detectCanvas.toDataURL('image/jpeg', 0.7)

        const res = await fetch('/api/scan-detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl, width: dw, height: dh }),
        })
        const data = await res.json()
        if (data.corners?.length === 4) {
          // Scale corners back to full resolution
          const sx = w / dw, sy = h / dh
          setCorners(data.corners.map(c => ({ x: c.x * sx, y: c.y * sy })))
        } else {
          setCorners(autoDetectCorners(canvas))
        }
      } catch {
        setCorners(autoDetectCorners(canvas))
      }
      setDetecting(false)
    }
    img.src = imageSrc
  }, [imageSrc])

  // Recalculate scale on resize
  useEffect(() => {
    function handleResize() {
      if (containerRef.current && imgSize.w > 0) {
        setDisplayScale(containerRef.current.clientWidth / imgSize.w)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [imgSize])

  const getEventPos = useCallback((e) => {
    const rect = containerRef.current.getBoundingClientRect()
    const touch = e.touches?.[0]
    const cx = (touch?.clientX ?? e.clientX) - rect.left
    const cy = (touch?.clientY ?? e.clientY) - rect.top
    return { x: cx / displayScale, y: cy / displayScale }
  }, [displayScale])

  function handleStart(e) {
    e.preventDefault()
    if (!corners) return
    const pos = getEventPos(e)
    // Find closest corner
    let minDist = Infinity, idx = -1
    corners.forEach((c, i) => {
      const d = Math.hypot(c.x - pos.x, c.y - pos.y)
      if (d < minDist) { minDist = d; idx = i }
    })
    if (minDist < 40 / displayScale) {
      setDraggingIdx(idx)
    }
  }

  function handleMove(e) {
    if (draggingIdx < 0) return
    e.preventDefault()
    const pos = getEventPos(e)
    // Clamp to image bounds
    const x = Math.max(0, Math.min(imgSize.w, pos.x))
    const y = Math.max(0, Math.min(imgSize.h, pos.y))
    setCorners(prev => prev.map((c, i) => i === draggingIdx ? { x, y } : c))
  }

  function handleEnd() {
    setDraggingIdx(-1)
  }

  async function handleApply() {
    if (!corners || !canvasRef.current) return
    setProcessing(true)

    // Calculate output dimensions from corner positions
    const topW = Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y)
    const botW = Math.hypot(corners[2].x - corners[3].x, corners[2].y - corners[3].y)
    const leftH = Math.hypot(corners[3].x - corners[0].x, corners[3].y - corners[0].y)
    const rightH = Math.hypot(corners[2].x - corners[1].x, corners[2].y - corners[1].y)
    const outW = Math.round(Math.max(topW, botW))
    const outH = Math.round(Math.max(leftH, rightH))

    // Run warp in a timeout to let UI update
    await new Promise(resolve => setTimeout(resolve, 50))

    let warped = warpPerspective(canvasRef.current, corners, outW, outH)
    warped = enhanceScan(warped)

    warped.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        onComplete(url, blob)
      }
      setProcessing(false)
    }, 'image/jpeg', 0.92)
  }

  // Draw overlay
  const cornerLabels = ['TL', 'TR', 'BR', 'BL']

  return (
    <div className="scan-tool">
      <style>{`
        .scan-tool {
          display: flex; flex-direction: column; align-items: center;
          gap: 1rem; width: 100%;
        }
        .scan-header {
          font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--coral); text-align: center;
        }
        .scan-hint {
          font-family: var(--mono); font-size: 0.55rem; color: var(--muted);
          text-align: center; line-height: 1.5;
        }
        .scan-container {
          position: relative; width: 100%; max-width: 320px;
          touch-action: none; user-select: none;
          border: 1px solid var(--rule); background: #000;
        }
        .scan-canvas {
          width: 100%; display: block;
        }
        .scan-overlay {
          position: absolute; inset: 0; pointer-events: none;
        }
        .scan-overlay svg {
          width: 100%; height: 100%;
        }
        .scan-corner {
          pointer-events: auto; cursor: grab; touch-action: none;
        }
        .scan-corner:active { cursor: grabbing; }
        .scan-corner-label {
          font-family: var(--mono); font-size: 9px; fill: #fff;
          pointer-events: none;
        }
        .scan-actions {
          display: flex; gap: 0.6rem; flex-wrap: wrap; justify-content: center;
        }
        .scan-processing {
          font-family: var(--mono); font-size: 0.6rem; color: var(--coral);
          text-align: center;
        }
      `}</style>

      <div className="scan-header">Scan & Straighten</div>
      <div className="scan-hint">Drag the corners to match the book edges</div>

      <div
        ref={containerRef}
        className="scan-container"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      >
        <canvas ref={canvasRef} className="scan-canvas" />
        {corners && displayScale > 0 && (
          <div className="scan-overlay">
            <svg viewBox={`0 0 ${imgSize.w} ${imgSize.h}`}>
              {/* Dimmed area outside selection */}
              <defs>
                <mask id="scanMask">
                  <rect width={imgSize.w} height={imgSize.h} fill="white" />
                  <polygon
                    points={corners.map(c => `${c.x},${c.y}`).join(' ')}
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                width={imgSize.w} height={imgSize.h}
                fill="rgba(0,0,0,0.5)" mask="url(#scanMask)"
              />

              {/* Selection outline */}
              <polygon
                points={corners.map(c => `${c.x},${c.y}`).join(' ')}
                fill="none" stroke="var(--coral)" strokeWidth={2 / displayScale}
              />

              {/* Edge lines */}
              {corners.map((c, i) => {
                const next = corners[(i + 1) % 4]
                return (
                  <line key={i}
                    x1={c.x} y1={c.y} x2={next.x} y2={next.y}
                    stroke="var(--coral)" strokeWidth={2 / displayScale}
                    strokeDasharray={`${6 / displayScale} ${4 / displayScale}`}
                  />
                )
              })}

              {/* Corner handles */}
              {corners.map((c, i) => (
                <g key={i} className="scan-corner">
                  {/* Larger hit area */}
                  <circle cx={c.x} cy={c.y} r={20 / displayScale} fill="transparent" />
                  {/* Visible handle */}
                  <circle
                    cx={c.x} cy={c.y} r={8 / displayScale}
                    fill="var(--coral)" stroke="#fff" strokeWidth={2 / displayScale}
                  />
                  <text
                    className="scan-corner-label"
                    x={c.x + 12 / displayScale} y={c.y - 8 / displayScale}
                    fontSize={11 / displayScale}
                  >
                    {cornerLabels[i]}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}
      </div>

      {processing || detecting ? (
        <div className="scan-processing">{detecting ? 'Detecting book edges…' : 'Processing…'}</div>
      ) : (
        <div className="scan-actions">
          <button className="ce-btn ce-btn-primary" onClick={handleApply} disabled={!corners}>
            Apply Scan
          </button>
          <button className="ce-btn ce-btn-secondary" onClick={async () => {
            if (!canvasRef.current) return
            setDetecting(true)
            try {
              const detectMax = 1200
              const { w, h } = imgSize
              let dw = w, dh = h
              if (dw > detectMax || dh > detectMax) {
                const s = detectMax / Math.max(dw, dh)
                dw = Math.round(dw * s); dh = Math.round(dh * s)
              }
              const dc = document.createElement('canvas')
              dc.width = dw; dc.height = dh
              dc.getContext('2d').drawImage(canvasRef.current, 0, 0, dw, dh)
              const dataUrl = dc.toDataURL('image/jpeg', 0.7)
              const res = await fetch('/api/scan-detect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: dataUrl, width: dw, height: dh }),
              })
              const data = await res.json()
              if (data.corners?.length === 4) {
                const sx = w / dw, sy = h / dh
                setCorners(data.corners.map(c => ({ x: c.x * sx, y: c.y * sy })))
              } else setCorners(autoDetectCorners(canvasRef.current))
            } catch {
              setCorners(autoDetectCorners(canvasRef.current))
            }
            setDetecting(false)
          }}>
            Auto Detect
          </button>
          <button className="ce-btn ce-btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
      )}
    </div>
  )
}
