// Multi-source book pricing aggregator

/**
 * Search AbeBooks for book prices via structured data in search results
 */
async function searchAbeBooks(isbn, title) {
  const query = isbn || title
  if (!query) return null

  try {
    const searchParam = isbn
      ? `isbn=${encodeURIComponent(isbn)}`
      : `kn=${encodeURIComponent(title)}`

    const res = await fetch(
      `https://www.abebooks.com/servlet/SearchResults?${searchParam}&sortby=17&n=100121503`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html',
        },
        cache: 'no-store',
      }
    )

    if (!res.ok) return null

    const html = await res.text()

    // Extract prices from schema.org structured data: itemprop="price" content="30.83"
    const structuredPrices = [...html.matchAll(/itemprop="price"\s+content="([\d.]+)"/g)]
    // Also try item-price display: data-test-id="item-price">US$ 30.83
    const displayPrices = [...html.matchAll(/data-test-id="item-price"[^>]*>(?:US\$\s*|USD\s*)([\d,.]+)/g)]
    // Also try data-csa-c-cost attribute
    const csaPrices = [...html.matchAll(/data-csa-c-cost="([\d.]+)"/g)]

    const allMatches = [
      ...structuredPrices.map(m => parseFloat(m[1])),
      ...displayPrices.map(m => parseFloat(m[1].replace(',', ''))),
      ...csaPrices.map(m => parseFloat(m[1])),
    ]

    // Deduplicate (same price appears in multiple patterns)
    const prices = [...new Set(allMatches)].filter(p => p > 0 && p < 10000)

    if (prices.length === 0) return null

    prices.sort((a, b) => a - b)
    const mid = Math.floor(prices.length / 2)
    const median = prices.length % 2 === 0
      ? (prices[mid - 1] + prices[mid]) / 2
      : prices[mid]

    return {
      value: Math.round(median * 100) / 100,
      source: 'abebooks',
      listings: prices.length,
      low: prices[0],
      high: prices[prices.length - 1],
    }
  } catch {
    return null
  }
}

/**
 * Search Biblio.com — schema.org markup + display prices
 */
async function searchBiblio(isbn, title) {
  const query = isbn || title
  if (!query) return null

  try {
    const path = isbn
      ? `isbn/${encodeURIComponent(isbn)}`
      : `search.php?stage=1&result_type=works&keyisbn=${encodeURIComponent(title)}`

    const url = isbn
      ? `https://www.biblio.com/${path}`
      : `https://www.biblio.com/${path}`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      cache: 'no-store',
    })

    if (!res.ok) return null

    const html = await res.text()

    // Schema.org: <span itemprop="price" content="12.34">
    const structured = [...html.matchAll(/itemprop="price"\s+content="([\d.]+)"/g)]
    // Display: "USD 12.34" or "$12.34" inside typical listing price containers
    const display = [...html.matchAll(/class="[^"]*(?:item-price|listing-price)[^"]*"[^>]*>\s*(?:USD|US\$|\$)\s*([\d,.]+)/gi)]

    const allMatches = [
      ...structured.map(m => parseFloat(m[1])),
      ...display.map(m => parseFloat(m[1].replace(',', ''))),
    ]
    const prices = [...new Set(allMatches)].filter(p => p > 0 && p < 10000)
    if (prices.length === 0) return null

    prices.sort((a, b) => a - b)
    const mid = Math.floor(prices.length / 2)
    const median = prices.length % 2 === 0
      ? (prices[mid - 1] + prices[mid]) / 2
      : prices[mid]

    return {
      value: Math.round(median * 100) / 100,
      source: 'biblio',
      listings: prices.length,
      low: prices[0],
      high: prices[prices.length - 1],
    }
  } catch {
    return null
  }
}

/**
 * Search ISBNdb for MSRP data
 */
async function searchISBNdb(isbn) {
  const apiKey = process.env.ISBNDB_API_KEY
  if (!apiKey || !isbn) return null

  try {
    const res = await fetch(`https://api2.isbndb.com/book/${isbn}`, {
      headers: { 'Authorization': apiKey },
      cache: 'no-store',
    })

    if (!res.ok) return null

    const data = await res.json()
    const book = data.book
    if (!book?.msrp || book.msrp <= 0) return null

    return {
      value: Math.round(book.msrp * 100) / 100,
      source: 'isbndb_msrp',
      listings: 1,
    }
  } catch {
    return null
  }
}

/**
 * Search Google Books for retail price
 */
async function searchGoogleBooks(isbn, title) {
  try {
    if (isbn) {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`,
        { cache: 'no-store' }
      )
      if (res.ok) {
        const json = await res.json()
        const saleInfo = json.items?.[0]?.saleInfo
        if (saleInfo?.listPrice?.amount > 0) {
          return { value: saleInfo.listPrice.amount, source: 'google_books', listings: 1 }
        }
        if (saleInfo?.retailPrice?.amount > 0) {
          return { value: saleInfo.retailPrice.amount, source: 'google_books', listings: 1 }
        }
      }
    }

    if (title) {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=3`,
        { cache: 'no-store' }
      )
      if (res.ok) {
        const json = await res.json()
        for (const item of json.items ?? []) {
          const si = item.saleInfo
          if (si?.listPrice?.amount > 0) {
            return { value: si.listPrice.amount, source: 'google_books', listings: 1 }
          }
          if (si?.retailPrice?.amount > 0) {
            return { value: si.retailPrice.amount, source: 'google_books', listings: 1 }
          }
        }
      }
    }
  } catch {}
  return null
}

/**
 * Claude AI price estimation — universal fallback for any language/country
 */
async function estimateWithClaude(isbn, title, bookInfo = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  try {
    const details = [
      title && `Title: ${title}`,
      bookInfo.subtitle && `Subtitle: ${bookInfo.subtitle}`,
      bookInfo.author && `Author: ${bookInfo.author}`,
      bookInfo.publisher && `Publisher: ${bookInfo.publisher}`,
      isbn && `ISBN: ${isbn}`,
      bookInfo.year && `Year: ${bookInfo.year}`,
      bookInfo.language && `Language: ${bookInfo.language}`,
      bookInfo.country && `Country: ${bookInfo.country}`,
      bookInfo.format && `Format: ${bookInfo.format}`,
      bookInfo.condition && `Condition: ${bookInfo.condition}`,
      bookInfo.pages && `Pages: ${bookInfo.pages}`,
      bookInfo.printing && `Printing: ${bookInfo.printing}`,
    ].filter(Boolean).join('\n')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `You are a used book pricing expert. Estimate the current USED market value for this book.

${details}

IMPORTANT RULES:
- First estimate the price in the book's LOCAL currency (e.g. Turkish Lira for Turkish books, EUR for French books, GBP for British books, etc.)
- Then convert to USD using these approximate rates: 1 USD = 38 TRY, 1 USD = 0.92 EUR, 1 USD = 0.79 GBP, 1 USD = 155 JPY, 1 USD = 7.25 CNY, 1 USD = 85 INR, 1 USD = 1370 KRW
- For Turkish books: typical used cookbook prices range 50-300 TRY ($1.30-$8 USD). Rare/vintage ones may be 300-1000 TRY ($8-$26 USD). Do NOT inflate to match Western book prices.
- For English books: use typical US/UK used market prices
- Consider condition: mint commands premium, poor significantly reduces value
- These are USED book prices, not new retail prices

Respond ONLY with a JSON object: {"low": <number>, "mid": <number>, "high": <number>, "local_currency": "<currency code>", "local_mid": <price in local currency>, "confidence": "<low|medium|high>", "note": "<brief 1-sentence reasoning>"}

All low/mid/high values must be in USD. If you truly cannot estimate, respond: {"low": 0, "mid": 0, "high": 0, "confidence": "none", "note": "Unable to estimate"}`,
        }],
      }),
    })

    if (!res.ok) return null

    const msg = await res.json()
    const text = msg.content?.[0]?.text || ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null

    const est = JSON.parse(match[0])
    if (!est.mid || est.mid <= 0 || est.confidence === 'none') return null

    return {
      value: Math.round(est.mid * 100) / 100,
      source: 'ai_estimate',
      listings: 0,
      low: est.low,
      high: est.high,
      confidence: est.confidence,
      note: est.note,
    }
  } catch {
    return null
  }
}

/**
 * Main pricing function — queries all sources in parallel and aggregates
 */
export async function lookupBookPrice(isbn, title, bookInfo = {}) {
  const { searchEbaySoldPrice } = await import('./ebay.js')

  // Run market sources in parallel first
  const results = await Promise.allSettled([
    searchEbaySoldPrice(isbn, title),
    searchAbeBooks(isbn, title),
    searchBiblio(isbn, title),
    searchGoogleBooks(isbn, title),
    searchISBNdb(isbn),
  ])

  const sources = []
  const allPrices = []

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result.status === 'fulfilled' && result.value) {
      const r = result.value
      sources.push({
        name: r.source,
        value: r.value,
        listings: r.listings,
        low: r.low,
        high: r.high,
      })
      allPrices.push(r.value)
    }
  }

  // If no market sources found, fall back to Claude AI estimation
  if (allPrices.length === 0) {
    const aiResult = await estimateWithClaude(isbn, title, bookInfo)
    if (aiResult) {
      return {
        value: aiResult.value,
        source: 'ai_estimate',
        sources: [{
          name: 'ai_estimate',
          value: aiResult.value,
          listings: 0,
          low: aiResult.low,
          high: aiResult.high,
          confidence: aiResult.confidence,
          note: aiResult.note,
        }],
        median: aiResult.value,
        low: aiResult.low,
        high: aiResult.high,
        sourceCount: 1,
      }
    }
    return null
  }

  // Calculate median across all sources
  allPrices.sort((a, b) => a - b)
  const mid = Math.floor(allPrices.length / 2)
  const median = allPrices.length % 2 === 0
    ? (allPrices[mid - 1] + allPrices[mid]) / 2
    : allPrices[mid]

  // Prefer market sources (eBay, AbeBooks) over retail
  const marketSource = sources.find(s =>
    s.name.startsWith('ebay') || s.name === 'abebooks'
  )

  return {
    value: Math.round((marketSource?.value ?? median) * 100) / 100,
    source: sources.map(s => s.name).join('+'),
    sources,
    median: Math.round(median * 100) / 100,
    low: allPrices[0],
    high: allPrices[allPrices.length - 1],
    sourceCount: sources.length,
  }
}
