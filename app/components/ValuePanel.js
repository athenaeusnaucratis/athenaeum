'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ValuePanel({ bookId, currentValue, lastChecked }) {
  const router = useRouter()
  const [history, setHistory] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [looking, setLooking] = useState(false)
  const [manualValue, setManualValue] = useState('')
  const [showManual, setShowManual] = useState(false)
  const [message, setMessage] = useState(null)

  async function loadHistory() {
    const res = await fetch(`/api/books/${bookId}/value`)
    const data = await res.json()
    setHistory(data)
    setShowHistory(true)
  }

  async function handleLookup() {
    setLooking(true)
    setMessage(null)
    const res = await fetch(`/api/books/${bookId}/value`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'lookup' }),
    })
    const data = await res.json()
    setLooking(false)
    if (data.value) {
      setMessage(`Found: $${Number(data.value).toFixed(2)} (${data.source})`)
      router.refresh()
      if (showHistory) loadHistory()
    } else {
      setMessage('No price data found online.')
    }
  }

  async function handleManualSubmit(e) {
    e.preventDefault()
    if (!manualValue) return
    await fetch(`/api/books/${bookId}/value`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: manualValue, source: 'manual' }),
    })
    setManualValue('')
    setShowManual(false)
    setMessage(`Value set to $${Number(manualValue).toFixed(2)}`)
    router.refresh()
    if (showHistory) loadHistory()
  }

  return (
    <div className="value-panel">
      <p className="vp-label">Market Value</p>

      <div className="vp-current">
        {currentValue
          ? <span className="vp-amount">${Number(currentValue).toFixed(2)}</span>
          : <span className="vp-no-value">Not set</span>
        }
        {lastChecked && (
          <span className="vp-checked">Last checked {new Date(lastChecked).toLocaleDateString()}</span>
        )}
      </div>

      <div className="vp-actions">
        <button className="vp-btn" onClick={handleLookup} disabled={looking}>
          {looking ? 'Looking up…' : 'Refresh Value'}
        </button>
        <button className="vp-btn" onClick={() => setShowManual(p => !p)}>
          Set Manually
        </button>
        <button className="vp-btn" onClick={loadHistory}>
          {showHistory ? 'Refresh History' : 'View History'}
        </button>
      </div>

      {message && <p className="vp-message">{message}</p>}

      {showManual && (
        <form className="vp-manual" onSubmit={handleManualSubmit}>
          <input
            type="number"
            step="0.01"
            placeholder="USD value"
            value={manualValue}
            onChange={e => setManualValue(e.target.value)}
          />
          <button type="submit">Set</button>
        </form>
      )}

      {showHistory && history && (
        <div className="vp-history">
          <p className="vp-hist-label">Value History</p>
          {history.length > 0 ? (
            <table className="vp-hist-table">
              <thead>
                <tr><th>Date</th><th>Value</th><th>Source</th></tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td>{new Date(h.recorded_at).toLocaleDateString()}</td>
                    <td className="vp-hist-val">${Number(h.value_usd).toFixed(2)}</td>
                    <td>{h.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="vp-empty">No history yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
