'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUSES = ['unread', 'reading', 'read', 'reference']

export default function ReadStatusPicker({ bookId, initialStatus }) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus ?? 'unread')

  async function handleChange(newStatus) {
    setStatus(newStatus)
    await fetch(`/api/books/${bookId}/read-status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    router.refresh()
  }

  return (
    <div className="rs-wrap">
      <p className="rs-label">Read Status</p>
      <div className="rs-options">
        {STATUSES.map(s => (
          <button
            key={s}
            className={`rs-btn${status === s ? ' active' : ''}`}
            onClick={() => handleChange(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
