'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteAuthorButton({ authorId, authorName }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/authors/${authorId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      router.push('/authors')
    } catch {
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="delete-confirm">
        <span className="delete-msg">Delete {authorName}?</span>
        <button className="vp-btn delete-yes" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button className="vp-btn" onClick={() => setConfirming(false)}>Cancel</button>
      </div>
    )
  }

  return (
    <button className="vp-btn delete-btn" onClick={() => setConfirming(true)}>
      Delete author
    </button>
  )
}
