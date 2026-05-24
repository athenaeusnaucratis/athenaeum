// Multi-source book pricing aggregator

/**
 * Search AbeBooks for book prices (web scraping their search)
 */
async function searchAbeBooks(isbn, title) {
  const query = isbn || title
  if (!query) return null

  try {
    // AbeBooks has a public search endpoint
    const searchParam = isbn
      ? `isbn=${encodeURIComponent(isbn)}`
      : `kn=${encodeURIComponent(title)}`

    const res = await fetch(
      `https://www.abebooks.com/servlet/SearchResults?${searchParam}&sortby=17&n=100121503`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BookPriceBot/1.0)',
          'Accept': 'text/html',
        },
        cache: 'no-store',
      }
    )

    if (!res.ok) return null

    const html = await res.text()

    // Extract prices from listing data using regex on the HTML
    const priceMatches = [...html.matchAll(/data-price="([\d.]+)"/g)]
    if (priceMatches.length === 0) {
      // Try alternative price pattern
      const altPrices = [...html.matchAll(/itemPrice[^>]*>\s*(?:US\$|USD\s*)\s*([\d,.]+)/gi)]
      if (altPrices.length === 0) return null

      const prices = altPrices
        .map(m => parseFloat(m[1].replace(',', '')))
        .filter(p => p > 0 && p < 10000)

      if (prices.length === 0) return null
      prices.sort((a, b) => a - b)
      const mid = Math.floor(prices.length / 2)
      return {
        value: Math.round(prices[mid] * 100) / 100,
        source: 'abebooks',
        listings: prices.length,
        low: prices[0],
        high: prices[prices.length - 1],
      }
    }

    const prices = priceMatches
      .map(m => parseFloat(m[1]))
      .filter(p => p > 0 && p < 10000)

    if (prices.length === 0) return null
    prices.sort((a, b) => a - b)
    const mid = Math.floor(prices.length / 2)

    return {
      value: Math.round(prices[mid] * 100) / 100,
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
 * Search Amazon product advertising or book price via ISBNdb
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
    if (!book) return null

    // ISBNdb returns msrp and sometimes other prices
    if (book.msrp && book.msrp > 0) {
      return {
        value: Math.round(book.msrp * 100) / 100,
        source: 'isbndb_msrp',
        listings: 1,
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Search Open Library for edition data (sometimes has price info)
 */
async function searchOpenLibrary(isbn, title) {
  if (!isbn && !title) return null

  try {
    let data = null

    if (isbn) {
      const res = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`,
        { cache: 'no-store' }
      )
      if (res.ok) {
        const json = await res.json()
        data = json[`ISBN:${isbn}`]
      }
    }

    if (!data && title) {
      const res = await fetch(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1`,
        { cache: 'no-store' }
      )
      if (res.ok) {
        const json = await res.json()
        const doc = json.docs?.[0]
        if (doc?.isbn?.[0]) {
          const isbnRes = await fetch(
            `https://openlibrary.org/api/books?bibkeys=ISBN:${doc.isbn[0]}&jscmd=data&format=json`,
            { cache: 'no-store' }
          )
          if (isbnRes.ok) {
            const isbnJson = await isbnRes.json()
            data = isbnJson[`ISBN:${doc.isbn[0]}`]
          }
        }
      }
    }

    if (!data) return null

    // Check for ebook prices or cover price
    if (data.ebooks) {
      for (const ebook of data.ebooks) {
        if (ebook.price && parseFloat(ebook.price) > 0) {
          return {
            value: parseFloat(ebook.price),
            source: 'openlibrary',
            listings: 1,
          }
        }
      }
    }

    return null
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
        if (saleInfo?.listPrice?.amount) {
          return { value: saleInfo.listPrice.amount, source: 'google_books' }
        }
        if (saleInfo?.retailPrice?.amount) {
          return { value: saleInfo.retailPrice.amount, source: 'google_books' }
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
          if (si?.listPrice?.amount) {
            return { value: si.listPrice.amount, source: 'google_books' }
          }
          if (si?.retailPrice?.amount) {
            return { value: si.retailPrice.amount, source: 'google_books' }
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
    searchOpenLibrary(isbn, title),
  ])

  const sources = []
  const allPrices = []

  const sourceNames = ['ebay', 'abebooks', 'google_books', 'isbndb', 'openlibrary']

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result.status === 'fulfilled' && result.value) {
      const r = result.value
      sources.push({
        name: r.source || sourceNames[i],
        value: r.value,
        listings: r.listings,
        low: r.low,
        high: r.high,
      })
      allPrices.push(r.value)
    }
  }

  if (allPrices.length === 0) return null

  // Calculate aggregated price — weighted median across sources
  allPrices.sort((a, b) => a - b)
  const mid = Math.floor(allPrices.length / 2)
  const median = allPrices.length % 2 === 0
    ? (allPrices[mid - 1] + allPrices[mid]) / 2
    : allPrices[mid]

  // Prefer eBay or AbeBooks as primary (real market prices)
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
