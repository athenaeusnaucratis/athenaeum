'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Pure-JS edge-based book detection.
// Runs on a small (256px) copy of the video frame — cheap enough to loop at
// ~6 fps on mobile without blocking touch events. No OpenCV, no WASM, no CDN.
// ─────────────────────────────────────────────────────────────────────────────

// Detect the book's bounding box from Sobel edges. Returns {tl, tr, br, bl}
// in the same coordinates as the input canvas, or null if nothing sensible.
function detectBookQuad(canvas) {
  const w = canvas.width, h = canvas.height
  const ctx = canvas.getContext('2d')
  const src = ctx.getImageData(0, 0, w, h).data

  // Grayscale
  const gray = new Uint8ClampedArray(w * h)
  for (let i = 0, j = 0; i < src.length; i += 4, j++) {
    gray[j] = (src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114) | 0
  }

  // Sobel magnitude
  const edges = new Uint8ClampedArray(w * h)
  let maxMag = 0
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const gx =
        -gray[(y - 1) * w + x - 1] + gray[(y - 1) * w + x + 1] +
        -2 * gray[y * w + x - 1] + 2 * gray[y * w + x + 1] +
        -gray[(y + 1) * w + x - 1] + gray[(y + 1) * w + x + 1]
      const gy =
        -gray[(y - 1) * w + x - 1] - 2 * gray[(y - 1) * w + x] - gray[(y - 1) * w + x + 1] +
        gray[(y + 1) * w + x - 1] + 2 * gray[(y + 1) * w + x] + gray[(y + 1) * w + x + 1]
      const m = Math.min(255, Math.hypot(gx, gy) | 0)
      edges[y * w + x] = m
      if (m > maxMag) maxMag = m
    }
  }
  if (maxMag < 30) return null // frame too flat

  const threshold = Math.max(40, maxMag * 0.28)

  // Row/column edge-strength profiles — sums of strong edges per row and column.
  const rowSum = new Float32Array(h)
  const colSum = new Float32Array(w)
  let strongCount = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const m = edges[y * w + x]
      if (m > threshold) {
        rowSum[y] += m
        colSum[x] += m
        strongCount++
      }
    }
  }
  if (strongCount < w * h * 0.005) return null // essentially no edges

  // Find the tightest span that captures ≥95 % of edge mass in each axis —
  // this rejects speckle at frame corners better than a raw first/last hit.
  const findSpan = (arr) => {
    let total = 0
    for (let i = 0; i < arr.length; i++) total += arr[i]
    if (total <= 0) return null
    const target = total * 0.95
    let best = { start: 0, end: arr.length - 1, span: arr.length }
    for (let start = 0; start < arr.length; start++) {
      let acc = 0
      for (let end = start; end < arr.length; end++) {
        acc += arr[end]
        if (acc >= target) {
          const span = end - start
          if (span < best.span) best = { start, end, span }
          break
        }
      }
    }
    return best
  }

  const rowSpan = findSpan(rowSum)
  const colSpan = findSpan(colSum)
  if (!rowSpan || !colSpan) return null

  const pad = Math.min(w, h) * 0.008
  const x0 = Math.max(0, colSpan.start - pad)
  const x1 = Math.min(w, colSpan.end + pad)
  const y0 = Math.max(0, rowSpan.start - pad)
  const y1 = Math.min(h, rowSpan.end + pad)

  // Must be a reasonable size — >20 % of the frame each direction
  if ((x1 - x0) < w * 0.2 || (y1 - y0) < h * 0.2) return null

  return [
    { x: x0, y: y0 },
    { x: x1, y: y0 },
    { x: x1, y: y1 },
    { x: x0, y: y1 },
  ]
}

// ── Perspective transform (pure JS) ─────────────────────────────────────────
function getPerspectiveTransform(src, dst) {
  const A = []
  const b = []
  for (let i = 0; i < 4; i++) {
    const sx = src[i].x, sy = src[i].y
    const dx = dst[i].x, dy = dst[i].y
    A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy])
    A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy])
    b.push(dx); b.push(dy)
  }
  const n = 8
  const M = A.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    let maxRow = col
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row
    }
    ;[M[col], M[maxRow]] = [M[maxRow], M[col]]
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
  return x
}

function applyInverse(coeffs, dx, dy) {
  const [a, b, c, d, e, f, g, h] = coeffs
  const denom = g * dx + h * dy + 1
  return { x: (a * dx + b * dy + c) / denom, y: (d * dx + e * dy + f) / denom }
}

function sampleBilinear(data, w, h, sx, sy) {
  const x0 = Math.floor(sx), y0 = Math.floor(sy)
  const x1 = Math.min(x0 + 1, w - 1), y1 = Math.min(y0 + 1, h - 1)
  const fx = sx - x0, fy = sy - y0
  const i00 = (y0 * w + x0) * 4, i10 = (y0 * w + x1) * 4
  const i01 = (y1 * w + x0) * 4, i11 = (y1 * w + x1) * 4
  const out = new Array(4)
  for (let c = 0; c < 4; c++) {
    const top = data[i00 + c] * (1 - fx) + data[i10 + c] * fx
    const bot = data[i01 + c] * (1 - fx) + data[i11 + c] * fx
    out[c] = top * (1 - fy) + bot * fy
  }
  return out
}

function warpPerspective(srcCanvas, corners, outW, outH) {
  const dst = [
    { x: 0, y: 0 }, { x: outW, y: 0 },
    { x: outW, y: outH }, { x: 0, y: outH },
  ]
  const coeffs = getPerspectiveTransform(dst, corners)
  const outCanvas = document.createElement('canvas')
  outCanvas.width = outW; outCanvas.height = outH
  const outCtx = outCanvas.getContext('2d')
  const srcCtx = srcCanvas.getContext('2d')
  const srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height).data
  const outImg = outCtx.createImageData(outW, outH)
  const sw = srcCanvas.width, sh = srcCanvas.height

  for (let dy = 0; dy < outH; dy++) {
    for (let dx = 0; dx < outW; dx++) {
      const src = applyInverse(coeffs, dx, dy)
      if (src.x >= 0 && src.x < sw - 1 && src.y >= 0 && src.y < sh - 1) {
        const [r, g, b, a] = sampleBilinear(srcData, sw, sh, src.x, src.y)
        const di = (dy * outW + dx) * 4
        outImg.data[di] = r; outImg.data[di + 1] = g
        outImg.data[di + 2] = b; outImg.data[di + 3] = a
      }
    }
  }
  outCtx.putImageData(outImg, 0, 0)
  return outCanvas
}

function enhance(canvas) {
  const ctx = canvas.getContext('2d')
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = img.data
  const len = d.length

  // Auto levels
  let minR = 255, minG = 255, minB = 255, maxR = 0, maxG = 0, maxB = 0
  for (let i = 0; i < len; i += 4) {
    if (d[i] < minR) minR = d[i]; if (d[i] > maxR) maxR = d[i]
    if (d[i+1] < minG) minG = d[i+1]; if (d[i+1] > maxG) maxG = d[i+1]
    if (d[i+2] < minB) minB = d[i+2]; if (d[i+2] > maxB) maxB = d[i+2]
  }
  const rR = maxR - minR || 1, rG = maxG - minG || 1, rB = maxB - minB || 1
  for (let i = 0; i < len; i += 4) {
    d[i]   = Math.min(255, Math.max(0, ((d[i]   - minR) / rR) * 255)) | 0
    d[i+1] = Math.min(255, Math.max(0, ((d[i+1] - minG) / rG) * 255)) | 0
    d[i+2] = Math.min(255, Math.max(0, ((d[i+2] - minB) / rB) * 255)) | 0
  }

  // Unsharp mask (mild)
  const w = canvas.width, h = canvas.height
  const copy = new Uint8ClampedArray(d)
  const amount = 0.35
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4
      for (let c = 0; c < 3; c++) {
        const blur = (
          copy[((y-1)*w+x-1)*4+c] + copy[((y-1)*w+x)*4+c]*2 + copy[((y-1)*w+x+1)*4+c] +
          copy[(y*w+x-1)*4+c]*2   + copy[i+c]*4               + copy[(y*w+x+1)*4+c]*2 +
          copy[((y+1)*w+x-1)*4+c] + copy[((y+1)*w+x)*4+c]*2 + copy[((y+1)*w+x+1)*4+c]
        ) / 16
        d[i+c] = Math.min(255, Math.max(0, copy[i+c] + (copy[i+c] - blur) * amount)) | 0
      }
    }
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

function quadDelta(a, b) {
  if (!a || !b) return Infinity
  let sum = 0
  for (let i = 0; i < 4; i++) sum += Math.hypot(a[i].x - b[i].x, a[i].y - b[i].y)
  return sum / 4
}

const DETECTION_WIDTH = 256
const STABILITY_FRAMES = 4
const STABILITY_THRESHOLD_PX = 14
const OUTPUT_MAX_DIM = 2400
const LOOP_INTERVAL_MS = 220

export default function LiveScanTool({ onComplete, onCancel }) {
  const videoRef = useRef(null)
  const overlayRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const lastQuadRef = useRef(null)
  const stableCountRef = useRef(0)
  const capturingRef = useRef(false)
  const loopStoppedRef = useRef(false)
  const phaseRef = useRef('starting')

  const [phase, setPhase] = useState('starting') // starting | live | processing | captured | error
  const [errorMsg, setErrorMsg] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewBlob, setPreviewBlob] = useState(null)
  const [displayQuad, setDisplayQuad] = useState(null)
  const [videoBox, setVideoBox] = useState({ w: 0, h: 0, dw: 0, dh: 0 })

  useEffect(() => { phaseRef.current = phase }, [phase])

  // ── Start camera ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        // Request a wide aspect. Some browsers honour aspectRatio hints,
        // others just give what the sensor supports; we ask big.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1440 },
            height: { ideal: 1440 },
            aspectRatio: { ideal: 1 },
          },
          audio: false,
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        setPhase('live')
      } catch (e) {
        if (cancelled) return
        setErrorMsg(e.message || 'Camera failed to start')
        setPhase('error')
      }
    }
    init()
    return () => {
      cancelled = true
      cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Attach stream to the <video> element once it mounts (only exists in 'live' phase)
  useEffect(() => {
    if (phase !== 'live' && phase !== 'processing') return
    const v = videoRef.current
    if (!v || !streamRef.current) return
    if (v.srcObject !== streamRef.current) {
      v.srcObject = streamRef.current
      v.play().catch(() => {})
    }
  }, [phase])

  // Start the detection loop once we're in the 'live' phase and the video has dimensions
  useEffect(() => {
    if (phase !== 'live') return
    loopStoppedRef.current = false
    let lastDisplayQuad = null
    const detCanvas = document.createElement('canvas')

    const tick = () => {
      if (loopStoppedRef.current) return
      const phaseNow = phaseRef.current
      if (capturingRef.current || phaseNow !== 'live') {
        timerRef.current = setTimeout(tick, LOOP_INTERVAL_MS)
        return
      }
      const video = videoRef.current
      if (!video || video.readyState < 2 || video.videoWidth === 0) {
        timerRef.current = setTimeout(tick, LOOP_INTERVAL_MS)
        return
      }

      const vw = video.videoWidth, vh = video.videoHeight
      const scale = DETECTION_WIDTH / vw
      const dw = DETECTION_WIDTH, dh = Math.round(vh * scale)
      detCanvas.width = dw; detCanvas.height = dh
      const ctx = detCanvas.getContext('2d')
      ctx.drawImage(video, 0, 0, dw, dh)

      let quad = null
      try { quad = detectBookQuad(detCanvas) } catch {}

      const containerW = overlayRef.current?.clientWidth || dw
      const containerH = overlayRef.current?.clientHeight || dh
      if (videoBox.w !== vw || videoBox.h !== vh || videoBox.dw !== containerW || videoBox.dh !== containerH) {
        setVideoBox({ w: vw, h: vh, dw: containerW, dh: containerH })
      }

      if (quad) {
        const upscaled = quad.map(p => ({ x: p.x / scale, y: p.y / scale }))
        const delta = quadDelta(lastQuadRef.current, upscaled)
        if (delta < STABILITY_THRESHOLD_PX) stableCountRef.current += 1
        else stableCountRef.current = 0
        lastQuadRef.current = upscaled

        const sx = containerW / dw, sy = containerH / dh
        const disp = quad.map(p => ({ x: p.x * sx, y: p.y * sy }))
        const shifted = !lastDisplayQuad || disp.some((p, i) =>
          Math.abs(p.x - lastDisplayQuad[i].x) > 2 || Math.abs(p.y - lastDisplayQuad[i].y) > 2
        )
        if (shifted) {
          lastDisplayQuad = disp
          setDisplayQuad(disp)
        }

        if (stableCountRef.current >= STABILITY_FRAMES) {
          capturingRef.current = true
          capture(upscaled)
          return
        }
      } else {
        stableCountRef.current = 0
        lastQuadRef.current = null
        if (lastDisplayQuad !== null) {
          lastDisplayQuad = null
          setDisplayQuad(null)
        }
      }

      timerRef.current = setTimeout(tick, LOOP_INTERVAL_MS)
    }
    timerRef.current = setTimeout(tick, LOOP_INTERVAL_MS)

    return () => {
      loopStoppedRef.current = true
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const cleanup = useCallback(() => {
    loopStoppedRef.current = true
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  async function capture(quadInVideoCoords) {
    setPhase('processing')
    loopStoppedRef.current = true
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }

    try {
      const video = videoRef.current
      const vw = video.videoWidth, vh = video.videoHeight
      const fullCanvas = document.createElement('canvas')
      let outW = vw, outH = vh
      if (Math.max(vw, vh) > OUTPUT_MAX_DIM) {
        const s = OUTPUT_MAX_DIM / Math.max(vw, vh)
        outW = Math.round(vw * s); outH = Math.round(vh * s)
      }
      fullCanvas.width = outW; fullCanvas.height = outH
      fullCanvas.getContext('2d').drawImage(video, 0, 0, outW, outH)

      const scale = outW / vw
      const scaledQuad = quadInVideoCoords.map(p => ({ x: p.x * scale, y: p.y * scale }))

      const topW = Math.hypot(scaledQuad[1].x - scaledQuad[0].x, scaledQuad[1].y - scaledQuad[0].y)
      const botW = Math.hypot(scaledQuad[2].x - scaledQuad[3].x, scaledQuad[2].y - scaledQuad[3].y)
      const leftH = Math.hypot(scaledQuad[3].x - scaledQuad[0].x, scaledQuad[3].y - scaledQuad[0].y)
      const rightH = Math.hypot(scaledQuad[2].x - scaledQuad[1].x, scaledQuad[2].y - scaledQuad[1].y)
      const rectW = Math.round(Math.max(topW, botW))
      const rectH = Math.round(Math.max(leftH, rightH))

      // Let UI paint the "Processing…" state before we block
      await new Promise(r => setTimeout(r, 30))

      let warped = warpPerspective(fullCanvas, scaledQuad, rectW, rectH)
      warped = enhance(warped)

      warped.toBlob(blob => {
        if (!blob) {
          setErrorMsg('Failed to encode image')
          setPhase('error')
          return
        }
        const url = URL.createObjectURL(blob)
        setPreviewBlob(blob)
        setPreviewUrl(url)
        setPhase('captured')
      }, 'image/jpeg', 0.92)
    } catch (e) {
      setErrorMsg(e.message || 'Capture failed')
      setPhase('error')
    }
  }

  function handleManualCapture() {
    if (!videoRef.current) return
    const quad = lastQuadRef.current
    if (quad) {
      capturingRef.current = true
      capture(quad)
    } else {
      const vw = videoRef.current.videoWidth, vh = videoRef.current.videoHeight
      const m = 0.05
      const fallback = [
        { x: vw * m, y: vh * m }, { x: vw * (1 - m), y: vh * m },
        { x: vw * (1 - m), y: vh * (1 - m) }, { x: vw * m, y: vh * (1 - m) },
      ]
      capturingRef.current = true
      capture(fallback)
    }
  }

  function handleRetake() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null); setPreviewBlob(null)
    capturingRef.current = false
    stableCountRef.current = 0
    lastQuadRef.current = null
    setDisplayQuad(null)
    setPhase('live')
  }

  function handleUse() {
    if (previewUrl && previewBlob) {
      cleanup()
      onComplete(previewUrl, previewBlob)
    }
  }

  function handleCancel() {
    cleanup()
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    onCancel()
  }

  const stabilityPct = Math.min(1, stableCountRef.current / STABILITY_FRAMES)

  return (
    <div className="livescan">
      <style>{`
        .livescan {
          display: flex; flex-direction: column; align-items: center;
          gap: 1rem; width: 100%;
        }
        .ls-header {
          font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--coral); text-align: center;
        }
        .ls-hint {
          font-family: var(--mono); font-size: 0.58rem; color: var(--muted);
          text-align: center; line-height: 1.5;
        }
        .ls-stage {
          position: relative; width: 100%; max-width: 480px;
          aspect-ratio: 1 / 1;             /* square viewfinder */
          background: #000; border: 1px solid var(--rule);
          overflow: hidden;
        }
        .ls-stage video, .ls-stage img {
          width: 100%; height: 100%;
          object-fit: cover;               /* fill the wide frame */
          display: block;
        }
        .ls-overlay { position: absolute; inset: 0; pointer-events: none; }
        .ls-overlay svg { width: 100%; height: 100%; }
        .ls-progress-bar {
          position: absolute; bottom: 0; left: 0; height: 3px;
          background: var(--coral); transition: width 0.15s;
        }
        .ls-actions {
          display: flex; gap: 0.6rem; flex-wrap: wrap; justify-content: center;
        }
        .ls-loading {
          font-family: var(--mono); font-size: 0.65rem; color: var(--muted);
          padding: 3rem 1rem; text-align: center;
        }
      `}</style>

      {phase === 'starting' && (
        <div className="ls-loading">
          Requesting camera…
          <div style={{ marginTop: '1.2rem' }}>
            <button className="ce-btn ce-btn-ghost" onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      )}

      {phase === 'error' && (
        <>
          <div className="ls-header" style={{ color: 'var(--coral)' }}>Live scan unavailable</div>
          <div className="ls-hint" style={{ color: 'var(--coral)' }}>{errorMsg}</div>
          <div className="ls-actions">
            <button className="ce-btn ce-btn-ghost" onClick={handleCancel}>Close</button>
          </div>
        </>
      )}

      {(phase === 'live' || phase === 'processing' || phase === 'captured') && (
        <>
          <div className="ls-header">
            {phase === 'captured' ? 'Review Capture' : phase === 'processing' ? 'Processing…' : 'Live Scan'}
          </div>
          {phase === 'live' && (
            <div className="ls-hint">Point steadily at the cover — auto-captures when the outline is stable</div>
          )}

          <div ref={overlayRef} className="ls-stage">
            {phase === 'captured' && previewUrl ? (
              <img src={previewUrl} alt="Captured" />
            ) : (
              <>
                <video ref={videoRef} playsInline muted autoPlay />
                <div className="ls-overlay">
                  <svg viewBox={`0 0 ${videoBox.dw || 100} ${videoBox.dh || 100}`} preserveAspectRatio="none">
                    {displayQuad && (
                      <>
                        <polygon
                          points={displayQuad.map(p => `${p.x},${p.y}`).join(' ')}
                          fill="rgba(212, 98, 58, 0.14)"
                          stroke="var(--coral)"
                          strokeWidth="2"
                        />
                        {displayQuad.map((p, i) => (
                          <circle key={i} cx={p.x} cy={p.y} r="5" fill="var(--coral)" stroke="#fff" strokeWidth="1.5" />
                        ))}
                      </>
                    )}
                  </svg>
                </div>
                {phase === 'live' && (
                  <div className="ls-progress-bar" style={{ width: `${stabilityPct * 100}%` }} />
                )}
              </>
            )}
          </div>

          {phase === 'live' && (
            <div className="ls-actions">
              <button className="ce-btn ce-btn-primary" onClick={handleManualCapture}>Capture Now</button>
              <button className="ce-btn ce-btn-ghost" onClick={handleCancel}>Cancel</button>
            </div>
          )}

          {phase === 'captured' && (
            <div className="ls-actions">
              <button className="ce-btn ce-btn-primary" onClick={handleUse}>Use Photo</button>
              <button className="ce-btn ce-btn-secondary" onClick={handleRetake}>Retake</button>
              <button className="ce-btn ce-btn-ghost" onClick={handleCancel}>Cancel</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
