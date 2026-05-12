'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MetadataRefresh({ bookId, authorId }) {
  const router = useRouter()
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)

  const endpoint = bookId
    ? `/api/books/${bookId}/metadata`
    : `/api/authors/${authorId}/metadata`

  async function handleRefresh() {
    setStatus('loading')
    setResult(null)
    try {
      const res = await fetch(endpoint, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setResult(data)
      setStatus('done')
      if (data.count > 0) router.refresh()
    } catch (e) {
      setResult({ error: e.message })
      setStatus('error')
    }
  }

  return (
    <div className="meta-refresh">
      <p className="mr-label">Metadata</p>
      <div className="mr-row">
        <button
          className="vp-btn"
          onClick={handleRefresh}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Looking up…' : 'Refresh from APIs'}
        </button>
        {status === 'done' && result?.count > 0 && (
          <span className="mr-msg">
            Filled {result.count}: {result.filled.join(', ')} ({result.source})
          </span>
        )}
        {status === 'done' && (result?.count === 0 || result?.count === undefined) && (
          <span className="mr-msg">{result?.error || 'No blank fields to fill.'}</span>
        )}
        {status === 'error' && (
          <span className="mr-msg mr-err">{result?.error}</span>
        )}
      </div>
    </div>
  )
}
