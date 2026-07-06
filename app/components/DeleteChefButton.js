'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteChefButton({ chefId, chefName }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/chefs/${chefId}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) router.push('/chefs')
  }

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} style={{
        fontFamily: 'var(--mono)', fontSize: '0.65rem', letterSpacing: '0.08em',
        textTransform: 'uppercase', color: 'var(--muted)', background: 'transparent',
        border: '1px solid var(--rule)', padding: '0.45rem 0.9rem', cursor: 'pointer',
      }}>
        Delete Chef
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--muted)' }}>
        Delete “{chefName}”?
      </span>
      <button onClick={handleDelete} disabled={deleting} style={{
        fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--parchment)',
        background: 'var(--coral)', border: 'none', padding: '0.35rem 0.7rem', cursor: 'pointer',
      }}>{deleting ? 'Deleting…' : 'Yes, delete'}</button>
      <button onClick={() => setConfirming(false)} style={{
        fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--muted)',
        background: 'transparent', border: 'none', cursor: 'pointer',
      }}>Cancel</button>
    </div>
  )
}
