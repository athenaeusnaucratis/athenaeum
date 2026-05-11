'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const EMPTY_FORM = {
  title: '', subtitle: '', author: '', publisher: '',
  publication_year: '', page_count: '', language: '',
  cover_image_url: '', isbn_13: '', isbn_10: '',
}

export default function AddBookFlow() {
  const router = useRouter()
  const [stage, setStage] = useState('idle') // idle | scanning | looking_up | ocr_processing | confirm | saving | done
  const [form, setForm] = useState(EMPTY_FORM)
  const [captureMethod, setCaptureMethod] = useState('manual')
  const [error, setError] = useState(null)
  const [newBookId, setNewBookId] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const videoRef = useRef(null)
  const scannerRef = useRef(null)
  const fileInputRef = useRef(null)

  // Start barcode scanner
  useEffect(() => {
    if (stage !== 'scanning') return
    let active = true

    async function startScanner() {
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const reader = new BrowserMultiFormatReader()
      scannerRef.current = reader

      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        const backCamera = devices.find(d =>
          /back|rear|environment/i.test(d.label)
        ) ?? devices[0]

        if (!backCamera) {
          setError('No camera found.')
          setStage('idle')
          return
        }

        await reader.decodeFromVideoDevice(
          backCamera.deviceId,
          videoRef.current,
          (result, err) => {
            if (!active || !result) return
            active = false
            const isbn = result.getText()
            stopScanner()
            lookUpIsbn(isbn)
          }
        )
      } catch (e) {
        setError('Camera access denied.')
        setStage('idle')
      }
    }

    startScanner()
    return () => { active = false; stopScanner() }
  }, [stage])

  function stopScanner() {
    try { scannerRef.current?.reset() } catch {}
    // Force-stop all camera tracks — reset() alone doesn't always release them on mobile
    try {
      const stream = videoRef.current?.srcObject
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        videoRef.current.srcObject = null
      }
    } catch {}
  }

  async function lookUpIsbn(isbn) {
    setStage('looking_up')
    setError(null)
    // Strip any non-digit characters
    const clean = isbn.replace(/[^0-9Xx]/g, '')
    try {
      const res = await fetch(`/api/isbn/${clean}`)
      if (!res.ok) throw new Error(`Scanned "${clean}" — not found in Google Books or Open Library.`)
      const data = await res.json()
      setForm({ ...EMPTY_FORM, ...data })
      setCaptureMethod('barcode_scan')
    } catch (e) {
      setError(e.message)
      setForm({ ...EMPTY_FORM, isbn_13: clean.length === 13 ? clean : '', isbn_10: clean.length === 10 ? clean : '' })
      setCaptureMethod('barcode_scan')
    }
    setStage('confirm')
  }

  function handleManual() {
    setForm(EMPTY_FORM)
    setCaptureMethod('manual')
    setCoverFile(null)
    setCoverPreviewUrl(null)
    setStage('confirm')
  }

  function handleCoverSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreviewUrl(URL.createObjectURL(file))
  }

  async function handleOCR() {
    if (!coverFile) return
    setStage('ocr_processing')
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', coverFile)
      const res = await fetch('/api/ocr', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'OCR failed')
      setForm(prev => ({
        ...prev,
        title: data.title || prev.title,
        subtitle: data.subtitle || prev.subtitle,
        author: data.author || prev.author,
        publisher: data.publisher || prev.publisher,
      }))
      setCaptureMethod('cover_ocr')
    } catch (e) {
      setError(e.message + ' — fill in fields manually.')
    }
    setStage('confirm')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    setError(null)
    setStage('saving')

    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, capture_method: captureMethod }),
      })
      const json = await res.json()
      if (res.status === 409 && json.duplicate_id) {
        setNewBookId(json.duplicate_id)
        setError(`Duplicate: ${json.error}`)
        setStage('done')
        return
      }
      if (!res.ok) throw new Error(json.error ?? 'Failed to save.')
      const bookId = json.id
      setNewBookId(bookId)

      // Upload cover photo if we have one
      if (coverFile) {
        setUploadingCover(true)
        const fd = new FormData()
        fd.append('file', coverFile)
        await fetch(`/api/books/${bookId}/cover`, { method: 'POST', body: fd })
        setUploadingCover(false)
      }

      setStage('done')
    } catch (e) {
      setError(e.message)
      setStage('confirm')
    }
  }

  function field(key, label, opts = {}) {
    return (
      <div className="field">
        <label>{label}</label>
        <input
          type={opts.type ?? 'text'}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={opts.placeholder ?? ''}
          required={opts.required}
        />
      </div>
    )
  }

  // ── RENDER ──

  if (stage === 'idle') return (
    <div className="flow-center">
      <p className="flow-hint">How are you adding this book?</p>
      <div className="flow-buttons">
        <button className="btn-primary" onClick={() => { setError(null); setStage('scanning') }}>
          Scan Barcode
        </button>
        <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
          Photo of Cover
        </button>
        <button className="btn-secondary" onClick={handleManual}>
          Enter Manually
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => {
          handleCoverSelect(e)
          setCaptureMethod('cover_ocr')
          setStage('confirm')
        }}
      />
      {error && <p className="flow-error">{error}</p>}
    </div>
  )

  if (stage === 'scanning') return (
    <div className="scanner-wrap">
      <p className="flow-hint">Point camera at the ISBN barcode</p>
      <div className="video-frame">
        <video ref={videoRef} className="scanner-video" />
        <div className="scan-line" />
      </div>
      <button className="btn-ghost" onClick={() => { stopScanner(); setStage('idle') }}>
        Cancel
      </button>
    </div>
  )

  if (stage === 'looking_up') return (
    <div className="flow-center">
      <p className="flow-hint">Looking up ISBN…</p>
    </div>
  )

  if (stage === 'ocr_processing') return (
    <div className="flow-center">
      <p className="flow-hint">Reading cover with AI…</p>
      {coverPreviewUrl && <img src={coverPreviewUrl} alt="Cover" className="cover-preview" />}
    </div>
  )

  if (stage === 'confirm') return (
    <form className="book-form" onSubmit={handleSubmit}>
      <p className="flow-hint">Review and confirm the details</p>
      {error && <p className="flow-error">{error}</p>}

      {/* Cover photo section */}
      <div className="cover-section">
        {coverPreviewUrl ? (
          <div className="cover-with-ocr">
            <img src={coverPreviewUrl} alt="Cover" className="cover-preview" />
            <div className="cover-actions">
              <button type="button" className="btn-ghost" onClick={handleOCR}>
                Extract text from cover
              </button>
              <button type="button" className="btn-ghost" onClick={() => {
                setCoverFile(null); setCoverPreviewUrl(null)
              }}>
                Remove photo
              </button>
            </div>
          </div>
        ) : form.cover_image_url ? (
          <img src={form.cover_image_url} alt="Cover" className="cover-preview" />
        ) : (
          <button type="button" className="btn-secondary cover-upload-btn" onClick={() => fileInputRef.current?.click()}>
            + Add Cover Photo
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleCoverSelect}
        />
      </div>

      <div className="form-grid">
        {field('title', 'Title *', { required: true })}
        {field('subtitle', 'Subtitle')}
        {field('author', 'Author')}
        {field('publisher', 'Publisher')}
        {field('publication_year', 'Year', { type: 'number', placeholder: 'YYYY' })}
        {field('page_count', 'Pages', { type: 'number' })}
        {field('language', 'Language', { placeholder: 'en' })}
        {field('isbn_13', 'ISBN-13')}
        {field('isbn_10', 'ISBN-10')}
        {field('cover_image_url', 'Cover Image URL')}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          {uploadingCover ? 'Uploading cover…' : 'Save Book'}
        </button>
        <button type="button" className="btn-ghost" onClick={() => { setStage('idle'); setCoverFile(null); setCoverPreviewUrl(null) }}>Back</button>
      </div>
    </form>
  )

  if (stage === 'saving') return (
    <div className="flow-center">
      <p className="flow-hint">{uploadingCover ? 'Uploading cover…' : 'Saving…'}</p>
    </div>
  )

  if (stage === 'done') return (
    <div className="flow-center">
      {error
        ? <p className="flow-error">{error}</p>
        : <p className="flow-success">Book saved.</p>
      }
      <div className="flow-buttons">
        <Link href={`/books/${newBookId}`} className="btn-primary">View Book</Link>
        <button className="btn-secondary" onClick={() => {
          setForm(EMPTY_FORM); setCoverFile(null); setCoverPreviewUrl(null); setStage('idle')
        }}>
          Add Another
        </button>
      </div>
    </div>
  )
}
