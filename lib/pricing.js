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
 * Main pricing function — queries all sources in parallel and aggregates
 */
export async function lookupBookPrice(isbn, title) {
  const { searchEbaySoldPrice } = await import('./ebay.js')

  // Run all sources in parallel
  const results = await Promise.allSettled([
    searchEbaySoldPrice(isbn, title),
    searchAbeBooks(isbn, title),
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

  if (allPrices.length === 0) return null

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
