let cachedToken = null
let tokenExpiry = 0

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const clientId = process.env.EBAY_CLIENT_ID
  const clientSecret = process.env.EBAY_CLIENT_SECRET

  if (!clientId || !clientSecret) return null

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
    cache: 'no-store',
  })

  if (!res.ok) return null

  const data = await res.json()
  cachedToken = data.access_token
  // Expire 5 min early to be safe
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000
  return cachedToken
}

export async function searchEbaySoldPrice(isbn) {
  if (!isbn) return null
  const token = await getAccessToken()
  if (!token) return null

  // Only search by ISBN — title search is too unreliable for pricing
  const queries = [isbn]

  for (const query of queries) {
    try {
      const params = new URLSearchParams({
        q: query,
        category_ids: '261186', // Books & Magazines
        filter: 'buyingOptions:{FIXED_PRICE|AUCTION},conditions:{USED|VERY_GOOD|GOOD|ACCEPTABLE|NEW}',
        sort: 'newlyListed',
        limit: '10',
      })

      const res = await fetch(
        `https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          cache: 'no-store',
        }
      )

      if (!res.ok) continue

      const data = await res.json()
      const items = data.itemSummaries ?? []

      if (items.length === 0) continue

      // Collect USD prices
      const prices = items
        .map(item => {
          const price = parseFloat(item.price?.value)
          const currency = item.price?.currency
          if (currency === 'USD' && price > 0) return price
          return null
        })
        .filter(Boolean)

      if (prices.length === 0) continue

      // Return median price
      prices.sort((a, b) => a - b)
      const mid = Math.floor(prices.length / 2)
      const median = prices.length % 2 === 0
        ? (prices[mid - 1] + prices[mid]) / 2
        : prices[mid]

      return {
        value: Math.round(median * 100) / 100,
        source: isbn && query === isbn ? 'ebay_isbn' : 'ebay_title',
        listings: prices.length,
        low: prices[0],
        high: prices[prices.length - 1],
      }
    } catch {}
  }

  return null
}
