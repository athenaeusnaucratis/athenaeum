'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CURRENCIES = [
  { code: 'USD', symbol: '$', rate: 1 },
  { code: 'TRY', symbol: '₺', rate: 38 },
  { code: 'EUR', symbol: '€', rate: 0.92 },
  { code: 'GBP', symbol: '£', rate: 0.79 },
  { code: 'JPY', symbol: '¥', rate: 155 },
  { code: 'CNY', symbol: '¥', rate: 7.25 },
  { code: 'INR', symbol: '₹', rate: 85 },
  { code: 'KRW', symbol: '₩', rate: 1370 },
  { code: 'CAD', symbol: 'C$', rate: 1.37 },
  { code: 'AUD', symbol: 'A$', rate: 1.55 },
  { code: 'BRL', symbol: 'R$', rate: 5.1 },
]

function buildSearchLinks(title, isbn) {
  const q = encodeURIComponent(title || '')
  const links = []

  // Always show these
  if (isbn) {
    links.push({ name: 'eBay', url: `https://www.ebay.com/sch/i.html?_nkw=${isbn}&LH_Complete=1&LH_Sold=1` })
    links.push({ name: 'AbeBooks', url: `https://www.abebooks.com/servlet/SearchResults?isbn=${isbn}&sortby=17` })
    links.push({ name: 'Amazon', url: `https://www.amazon.com/s?k=${isbn}&i=stripbooks` })
  } else {
    links.push({ name: 'eBay', url: `https://www.ebay.com/sch/i.html?_nkw=${q}&LH_Complete=1&LH_Sold=1` })
    links.push({ name: 'AbeBooks', url: `https://www.abebooks.com/servlet/SearchResults?kn=${q}&sortby=17` })
    links.push({ name: 'Amazon', url: `https://www.amazon.com/s?k=${q}&i=stripbooks` })
  }

  // Turkish sources
  links.push({ name: 'Nadirkitap', url: `https://www.nadirkitap.com/search.php?ara=${q}&tip=kitap` })
  links.push({ name: 'Kitapyurdu', url: `https://www.kitapyurdu.com/index.php?route=product/search&filter_name=${q}` })
  links.push({ name: 'Amazon TR', url: `https://www.amazon.com.tr/s?k=${q}&i=stripbooks` })

  return links
}

const SOURCE_LABELS = {
  ebay_sold: 'eBay (sold)',
  ebay_active: 'eBay',
  abebooks: 'AbeBooks',
  biblio: 'Biblio',
  google_books: 'Google Books',
  isbndb_msrp: 'ISBNdb (MSRP)',
  ai_estimate: 'AI Estimate',
  manual: 'Manual entry',
}

function sourceLabel(name) {
  return SOURCE_LABELS[name] || name.replace(/_/g, ' ')
}

export default function ValuePanel({ bookId, currentValue, lastChecked, bookTitle, isbn, language, canEdit = true, initialSources }) {
  const router = useRouter()
  const [history, setHistory] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [looking, setLooking] = useState(false)
  const [sources, setSources] = useState(initialSources ?? [])
  const [manualValue, setManualValue] = useState('')
  const [currency, setCurrency] = useState(
    language === 'Turkish' ? 'TRY' :
    language === 'Japanese' ? 'JPY' :
    language === 'Korean' ? 'KRW' :
    language === 'Chinese' ? 'CNY' :
    language === 'Hindi' ? 'INR' :
    'USD'
  )
  const [showManual, setShowManual] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [message, setMessage] = useState(null)

  const searchLinks = buildSearchLinks(bookTitle, isbn)

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
      // Sync per-source rows from the response (server also persisted them)
      if (Array.isArray(data.sources)) {
        setSources(data.sources.map(s => ({
          source: s.name,
          value_usd: s.value,
          listings: s.listings ?? null,
          low_usd: s.low ?? null,
          high_usd: s.high ?? null,
          note: s.note ?? null,
        })))
      }
      const median = data.median ?? data.value
      setMessage(`Median $${Number(median).toFixed(2)} across ${data.sourceCount ?? data.sources?.length ?? 1} source${(data.sourceCount ?? 1) === 1 ? '' : 's'}`)
      router.refresh()
      if (showHistory) loadHistory()
    } else {
      setMessage('No price data found online.')
    }
  }

  function getUsdValue() {
    if (!manualValue) return 0
    const cur = CURRENCIES.find(c => c.code === currency)
    if (!cur) return parseFloat(manualValue)
    return parseFloat(manualValue) / cur.rate
  }

  async function handleManualSubmit(e) {
    e.preventDefault()
    if (!manualValue) return
    const usd = getUsdValue()
    const cur = CURRENCIES.find(c => c.code === currency)
    const source = currency === 'USD' ? 'manual' : `manual (${cur.symbol}${manualValue} ${currency})`
    await fetch(`/api/books/${bookId}/value`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: usd.toFixed(2), source }),
    })
    setManualValue('')
    setShowManual(false)
    setMessage(`Value set to $${usd.toFixed(2)}${currency !== 'USD' ? ` (${cur.symbol}${manualValue} ${currency})` : ''}`)
    router.refresh()
    if (showHistory) loadHistory()
  }

  const usdPreview = manualValue && currency !== 'USD'
    ? `≈ $${getUsdValue().toFixed(2)} USD`
    : null

  return (
    <div className="value-panel">
      <style>{`
        .vp-search-links {
          display: flex; flex-wrap: wrap; gap: 0.4rem;
          margin-top: 0.75rem;
        }
        .vp-search-link {
          font-family: var(--mono); font-size: 0.58rem; font-weight: 300;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--muted); background: transparent;
          border: 1px solid var(--rule); padding: 0.25rem 0.6rem;
          text-decoration: none; transition: all 0.15s;
          cursor: pointer;
        }
        .vp-search-link:hover { border-color: var(--coral); color: var(--coral); }
        .vp-search-label {
          font-family: var(--mono); font-size: 0.55rem;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--muted); margin-top: 0.75rem; margin-bottom: 0.4rem;
        }
        .vp-currency-row {
          display: flex; gap: 0.5rem; align-items: flex-end; margin-top: 0.75rem;
        }
        .vp-currency-select {
          font-family: var(--mono); font-size: 0.75rem; color: var(--ink);
          background: var(--parchment); border: none;
          border-bottom: 1px solid var(--rule);
          padding: 0.3rem 0.2rem; outline: none; width: 65px;
        }
        .vp-currency-select:focus { border-bottom-color: var(--coral); }
        .vp-currency-preview {
          font-family: var(--mono); font-size: 0.6rem;
          color: var(--coral); margin-top: 0.3rem;
        }
        .vp-sources {
          margin-top: 1.1rem; padding-top: 0.9rem;
          border-top: 1px solid var(--rule);
          display: flex; flex-direction: column;
        }
        .vp-source-row {
          display: grid; grid-template-columns: 130px 70px 1fr;
          gap: 0.6rem; align-items: baseline;
          padding: 0.4rem 0;
          border-bottom: 1px dashed var(--rule);
        }
        .vp-source-row:last-child { border-bottom: none; }
        .vp-source-name {
          font-family: var(--mono); font-size: 0.62rem;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--muted);
        }
        .vp-source-value {
          font-family: var(--serif); font-size: 1rem;
          color: var(--ink); font-weight: 400;
        }
        .vp-source-meta {
          font-family: var(--mono); font-size: 0.58rem;
          color: var(--muted); letter-spacing: 0.04em;
        }
        .vp-source-range { color: var(--rule); }
        .vp-source-note { font-style: italic; }
        @media (max-width: 520px) {
          .vp-source-row { grid-template-columns: 1fr auto; }
          .vp-source-meta { grid-column: 1 / -1; }
        }
      `}</style>

      <p className="vp-label">Market Value</p>

      <div className="vp-current">
        {currentValue
          ? <span className="vp-amount">${Number(currentValue).toFixed(2)}</span>
          : <span className="vp-no-value">Not set</span>
        }
        {sources.length > 0 && (
          <span className="vp-checked">Median across {sources.length} source{sources.length === 1 ? '' : 's'}</span>
        )}
        {lastChecked && (
          <span className="vp-checked">Last checked {new Date(lastChecked).toLocaleDateString()}</span>
        )}
      </div>

      {sources.length > 0 && (
        <div className="vp-sources">
          {sources.map(s => (
            <div key={s.source} className="vp-source-row">
              <span className="vp-source-name">{sourceLabel(s.source)}</span>
              <span className="vp-source-value">${Number(s.value_usd).toFixed(2)}</span>
              <span className="vp-source-meta">
                {s.listings ? `${s.listings} listing${s.listings === 1 ? '' : 's'}` : ''}
                {(s.low_usd != null && s.high_usd != null) && (
                  <span className="vp-source-range">
                    {s.listings ? ' · ' : ''}${Number(s.low_usd).toFixed(2)}–${Number(s.high_usd).toFixed(2)}
                  </span>
                )}
                {s.note && !s.listings && <span className="vp-source-note">{s.note}</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="vp-actions">
        {canEdit && (
          <>
            <button className="vp-btn" onClick={handleLookup} disabled={looking}>
              {looking ? 'Looking up…' : 'Auto Lookup'}
            </button>
            <button className="vp-btn" onClick={() => setShowManual(p => !p)}>
              Set Manually
            </button>
            <button className="vp-btn" onClick={() => setShowSearch(p => !p)}>
              {showSearch ? 'Hide Links' : 'Search Prices'}
            </button>
          </>
        )}
        <button className="vp-btn" onClick={loadHistory}>
          {showHistory ? 'Refresh History' : 'View History'}
        </button>
      </div>

      {message && <p className="vp-message">{message}</p>}

      {showSearch && (
        <div>
          <p className="vp-search-label">Look up price on</p>
          <div className="vp-search-links">
            {searchLinks.map(l => (
              <a key={l.name} href={l.url} target="_blank" rel="noopener noreferrer" className="vp-search-link">
                {l.name} ↗
              </a>
            ))}
          </div>
        </div>
      )}

      {showManual && (
        <form className="vp-currency-row" onSubmit={handleManualSubmit}>
          <input
            type="number"
            step="0.01"
            placeholder="Price"
            value={manualValue}
            onChange={e => setManualValue(e.target.value)}
            style={{
              fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--ink)',
              background: 'transparent', border: 'none', borderBottom: '1px solid var(--rule)',
              padding: '0.3rem 0', outline: 'none', width: '80px',
            }}
          />
          <select className="vp-currency-select" value={currency} onChange={e => setCurrency(e.target.value)}>
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
          <button type="submit" style={{
            fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--parchment)', background: 'var(--coral)',
            border: 'none', padding: '0.4rem 0.8rem', cursor: 'pointer',
          }}>Set</button>
        </form>
      )}
      {showManual && usdPreview && (
        <div className="vp-currency-preview">{usdPreview}</div>
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
