'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthorPromoteButtons({ authorId }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  async function promoteToChef() {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/authors/${authorId}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'chef' }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMessage(json.error || 'Failed')
        setBusy(false)
        return
      }
      router.push(`/chefs/${json.id}`)
      router.refresh()
    } catch (e) {
      setMessage(e.message || 'Network error')
      setBusy(false)
    }
  }

  return (
    <div className="meta-refresh">
      <p className="mr-label">Also list as</p>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <button
          onClick={promoteToChef}
          disabled={busy}
          style={{
            fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--muted)', background: 'transparent',
            border: '1px solid var(--rule)', padding: '0.4rem 0.8rem', cursor: 'pointer',
          }}
        >
          {busy ? 'Working…' : 'Chef →'}
        </button>
      </div>
      {message && (
        <p style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--coral)', marginTop: '0.6rem' }}>
          {message}
        </p>
      )}
    </div>
  )
}
