'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteBook({ bookId }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/books/${bookId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/collection')
    } else {
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="delete-wrap">
        <span className="delete-confirm-text">Remove this book permanently?</span>
        <button className="delete-yes" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button className="delete-no" onClick={() => setConfirming(false)}>Cancel</button>
      </div>
    )
  }

  return (
    <div className="delete-wrap">
      <button className="delete-btn" onClick={() => setConfirming(true)}>
        Delete book
      </button>
    </div>
  )
}
