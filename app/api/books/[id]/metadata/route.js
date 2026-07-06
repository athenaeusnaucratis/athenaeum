import { supabase, supabaseAdmin } from '@/lib/supabase'
import { normalizeLanguage, parseYear } from '@/lib/books'

// Normalize a string for fuzzy comparison
function norm(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Check if two strings are similar enough (one contains the other, or high overlap)
function isSimilar(a, b) {
  const na = norm(a)
  const nb = norm(b)
  if (!na || !nb) return false
  if (na.includes(nb) || nb.includes(na)) return true
  // Check word overlap
  const wordsA = new Set(na.match(/.{2,}/g) || [])
  const wordsB = new Set(nb.match(/.{2,}/g) || [])
  if (wordsA.size === 0 || wordsB.size === 0) return false
  let overlap = 0
  for (const w of wordsA) { if (wordsB.has(w)) overlap++ }
  return overlap / Math.max(wordsA.size, wordsB.size) > 0.5
}

// Validate that API result likely matches our book
function validateMatch(found, bookTitle, bookIsbn) {
  // ISBN match is always trusted
  if (bookIsbn && (found.isbn_13 === bookIsbn || found.isbn_10 === bookIsbn)) return true
  // Title must be similar
  if (found.title && bookTitle) return isSimilar(found.title, bookTitle)
  return false
}

function extractFromGoogleBooks(item) {
  return {
    title: item.title || null,
    subtitle: item.subtitle || null,
    author: item.authors?.[0] || null,
    publisher: item.publisher || null,
    publication_year: item.publishedDate ? parseInt(item.publishedDate) : null,
    page_count: item.pageCount || null,
    language: item.language || null,
    cover_image_url: item.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
    isbn_13: item.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier || null,
    isbn_10: item.industryIdentifiers?.find(i => i.type === 'ISBN_10')?.identifier || null,
    description: item.description || null,
  }
}

async function lookupMetadata(isbn, title) {
  const result = {}
  const sources = []

  // Helper: fetch Open Library work details (description, covers)
  async function fetchOLWork(workKey) {
    try {
      const workRes = await fetch(`https://openlibrary.org${workKey}.json`, { cache: 'no-store' })
      if (!workRes.ok) return null
      return await workRes.json()
    } catch { return null }
  }

  // 1. Open Library by ISBN (most reliable, no rate limits)
  if (isbn) {
    try {
      const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`, { cache: 'no-store' })
      if (res.ok) {
        const ol = await res.json()
        result.page_count = ol.number_of_pages || null
        result.publisher = ol.publishers?.[0] || null
        if (ol.publish_date) result.publication_year = parseInt(ol.publish_date)
        if (ol.covers?.[0]) result.cover_image_url = `https://covers.openlibrary.org/b/id/${ol.covers[0]}-M.jpg`
        result.isbn_13 = ol.isbn_13?.[0] || null
        result.isbn_10 = ol.isbn_10?.[0] || null

        if (ol.authors?.[0]?.key) {
          try {
            const authorRes = await fetch(`https://openlibrary.org${ol.authors[0].key}.json`)
            const authorData = await authorRes.json()
            result.author = authorData.name || null
          } catch {}
        }

        if (ol.works?.[0]?.key) {
          const work = await fetchOLWork(ol.works[0].key)
          if (work) {
            const desc = typeof work.description === 'string' ? work.description : work.description?.value || null
            if (desc) result.description = desc
          }
        }
        sources.push('open_library')
      }
    } catch (e) { console.error('Open Library ISBN error:', e.message) }
  }

  // 2. Open Library search by title (works without ISBN too)
  if (title) {
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=5&fields=key,title,author_name,publisher,first_publish_year,number_of_pages_median,isbn,cover_i,language,subtitle`,
        { cache: 'no-store' }
      )
      if (res.ok) {
        const search = await res.json()
        const match = (search.docs ?? []).find(d => isSimilar(d.title, title))
        if (match) {
          if (!result.author && match.author_name?.[0]) result.author = match.author_name[0]
          if (!result.publisher && match.publisher?.[0]) result.publisher = match.publisher[0]
          if (!result.publication_year && match.first_publish_year) result.publication_year = match.first_publish_year
          if (!result.page_count && match.number_of_pages_median) result.page_count = match.number_of_pages_median
          if (!result.subtitle && match.subtitle) result.subtitle = match.subtitle
          if (!result.cover_image_url && match.cover_i) result.cover_image_url = `https://covers.openlibrary.org/b/id/${match.cover_i}-M.jpg`
          if (!result.isbn_13 && match.isbn?.[0]) {
            const isbn13 = match.isbn.find(i => i.length === 13)
            const isbn10 = match.isbn.find(i => i.length === 10)
            if (!result.isbn_13 && isbn13) result.isbn_13 = isbn13
            if (!result.isbn_10 && isbn10) result.isbn_10 = isbn10
          }
          if (!result.language && match.language?.[0]) {
            const langMap = { eng: 'en', fre: 'fr', spa: 'es', ger: 'de', ita: 'it', jpn: 'ja', chi: 'zh', tur: 'tr', por: 'pt', dut: 'nl', rus: 'ru' }
            result.language = langMap[match.language[0]] || match.language[0]
          }

          // Get description from work
          if (!result.description && match.key) {
            const work = await fetchOLWork(match.key)
            if (work) {
              const desc = typeof work.description === 'string' ? work.description : work.description?.value || null
              if (desc) result.description = desc
              if (!result.cover_image_url && work.covers?.[0]) {
                result.cover_image_url = `https://covers.openlibrary.org/b/id/${work.covers[0]}-M.jpg`
              }
            }
          }
          if (!sources.includes('open_library')) sources.push('open_library')
        }
      }
    } catch (e) { console.error('Open Library search error:', e.message) }
  }

  // 3. Google Books (may be rate-limited, so it's supplementary now)
  const gbQuery = isbn ? `isbn:${isbn}` : title ? `intitle:${encodeURIComponent(title)}` : null
  if (gbQuery) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${gbQuery}&maxResults=3`,
        { cache: 'no-store' }
      )
      if (res.ok) {
        const json = await res.json()
        for (const vol of json.items ?? []) {
          const item = vol.volumeInfo
          if (!item) continue
          const gb = extractFromGoogleBooks(item)
          // For title search, validate match
          if (!isbn && !isSimilar(gb.title, title)) continue
          if (!result.title && gb.title) result.title = gb.title
          if (!result.subtitle && gb.subtitle) result.subtitle = gb.subtitle
          if (!result.author && gb.author) result.author = gb.author
          if (!result.publisher && gb.publisher) result.publisher = gb.publisher
          if (!result.publication_year && gb.publication_year) result.publication_year = gb.publication_year
          if (!result.page_count && gb.page_count) result.page_count = gb.page_count
          if (!result.language && gb.language) result.language = gb.language
          if (!result.cover_image_url && gb.cover_image_url) result.cover_image_url = gb.cover_image_url
          if (!result.description && gb.description) result.description = gb.description
          if (!result.isbn_13 && gb.isbn_13) result.isbn_13 = gb.isbn_13
          if (!result.isbn_10 && gb.isbn_10) result.isbn_10 = gb.isbn_10
          sources.push('google_books')
          break
        }
      }
    } catch (e) { console.error('Google Books error:', e.message) }
  }

  // 4. Library of Congress — good for publisher, year, language
  const locQuery = isbn || (title && title.length >= 8 ? title : null)
  if (locQuery && (!result.publisher || !result.publication_year || !result.language)) {
    try {
      const field = isbn ? 'isbn' : 'title'
      const res = await fetch(
        `https://www.loc.gov/books/?q=${field}:${encodeURIComponent(locQuery)}&fo=json&c=1`,
        { cache: 'no-store' }
      )
      if (res.ok) {
        const loc = await res.json()
        const item = !isbn
          ? (loc.results ?? []).find(r => isSimilar(r.title, title))
          : loc.results?.[0]
        if (item) {
          if (!result.publisher && item.item?.created_published) {
            const parts = item.item.created_published.split(',')
            if (parts.length > 1) {
              const cleaned = parts[0].replace(/[\[\]]/g, '').trim()
              if (cleaned.length > 2) result.publisher = cleaned
            }
          }
          if (!result.publication_year && item.date) {
            const year = parseInt(item.date)
            if (year > 1800 && year < 2100) result.publication_year = year
          }
          if (!result.language) {
            const lang = item.language?.[0]
            if (lang) {
              const langMap = { english: 'en', french: 'fr', spanish: 'es', german: 'de', italian: 'it', japanese: 'ja', chinese: 'zh', turkish: 'tr', portuguese: 'pt', dutch: 'nl', russian: 'ru' }
              result.language = langMap[lang.toLowerCase()] || lang.substring(0, 2).toLowerCase()
            }
          }
          if (!result.description && item.description?.[0]) result.description = item.description[0]
          sources.push('loc')
        }
      }
    } catch (e) { console.error('Library of Congress error:', e.message) }
  }

  // 5. Claude AI enrichment — fill remaining gaps with LLM knowledge
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
  const missingFields = []
  if (!result.description) missingFields.push('description')
  if (!result.subtitle) missingFields.push('subtitle')
  if (!result.author) missingFields.push('author')
  if (!result.publisher) missingFields.push('publisher')
  if (!result.publication_year) missingFields.push('publication_year')
  if (!result.page_count) missingFields.push('page_count')
  if (!result.language) missingFields.push('language')

  if (ANTHROPIC_KEY && missingFields.length > 0 && (title || isbn)) {
    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic({ apiKey: ANTHROPIC_KEY })

      const known = []
      if (title) known.push(`Title: ${title}`)
      if (isbn) known.push(`ISBN: ${isbn}`)
      if (result.author) known.push(`Author: ${result.author}`)
      if (result.publisher) known.push(`Publisher: ${result.publisher}`)
      if (result.publication_year) known.push(`Year: ${result.publication_year}`)

      const aiRes = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: `You are a book reference librarian. Given this cookbook information:
${known.join('\n')}

Provide the following missing fields: ${missingFields.join(', ')}

For "description": write a 2-3 sentence summary of what the book is about, its cuisine focus, and why it's notable. Be factual — if you don't know the book, say so.

Return ONLY a JSON object with the requested fields. Use null for anything you cannot determine with confidence. Example:
{"description": "A comprehensive guide to...", "subtitle": "...", "author": "...", "publisher": "...", "publication_year": 1995, "page_count": 320, "language": "en"}

Return ONLY the JSON, no explanation.`
        }],
      })

      const aiText = aiRes.content[0]?.text || ''
      const jsonMatch = aiText.match(/\{[\s\S]*?\}/)
      if (jsonMatch) {
        const ai = JSON.parse(jsonMatch[0])
        const unknownPattern = /do not recognize|don't recognize|not familiar|cannot determine|cannot provide|not able to|unable to verify|don't know this book|not aware of/i
        if (!result.description && ai.description && ai.description !== 'null' && !unknownPattern.test(ai.description)) { result.description = ai.description }
        if (!result.subtitle && ai.subtitle && ai.subtitle !== 'null') { result.subtitle = ai.subtitle }
        if (!result.author && ai.author && ai.author !== 'null') { result.author = ai.author }
        if (!result.publisher && ai.publisher && ai.publisher !== 'null') { result.publisher = ai.publisher }
        if (!result.publication_year && ai.publication_year) { result.publication_year = parseInt(ai.publication_year) }
        if (!result.page_count && ai.page_count) { result.page_count = parseInt(ai.page_count) }
        if (!result.language && ai.language && ai.language !== 'null') { result.language = ai.language }
        sources.push('claude')
      }
    } catch (e) { console.error('Claude enrichment error:', e.message) }
  }

  // Final normalization: language codes → full names, robust year parse
  if (result.language) result.language = normalizeLanguage(result.language)
  if (result.publication_year) result.publication_year = parseYear(result.publication_year)

  result.source = sources.join('+') || null
  const dataKeys = Object.keys(result).filter(k => k !== 'source' && result[k] != null)
  return dataKeys.length > 0 ? result : null
}

export async function POST(request, { params }) {
  const { id } = await params

  const { data: book } = await supabase
    .from('books')
    .select('id, title, isbn_13, isbn_10, subtitle, publication_year, page_count, language, cover_image_url, description, publisher_id, publishers(name)')
    .eq('id', id)
    .single()

  if (!book) return Response.json({ error: 'Book not found' }, { status: 404 })

  const isbn = book.isbn_13 || book.isbn_10
  const found = await lookupMetadata(isbn, book.title)

  if (!found) {
    return Response.json({
      error: 'No metadata found from any source',
      filled: [], count: 0,
      _debug: { isbn, title: book.title, bookFields: {
        subtitle: book.subtitle, publication_year: book.publication_year,
        page_count: book.page_count, language: book.language,
        description: book.description, publisher: book.publishers?.name,
        isbn_13: book.isbn_13, isbn_10: book.isbn_10,
      }}
    }, { status: 200 })
  }

  // Only fill in blank fields — never overwrite existing data
  const update = {}
  const filled = []

  if (!book.subtitle && found.subtitle) { update.subtitle = found.subtitle; filled.push('subtitle') }
  if (!book.publication_year && found.publication_year) { update.publication_year = found.publication_year; filled.push('year') }
  if (!book.page_count && found.page_count) { update.page_count = found.page_count; filled.push('pages') }
  if (!book.language && found.language) { update.language = found.language; filled.push('language') }
  if (!book.cover_image_url && found.cover_image_url) { update.cover_image_url = found.cover_image_url; filled.push('cover') }
  if (!book.isbn_13 && found.isbn_13) { update.isbn_13 = found.isbn_13; filled.push('isbn_13') }
  if (!book.isbn_10 && found.isbn_10) { update.isbn_10 = found.isbn_10; filled.push('isbn_10') }
  if (!book.description && found.description) { update.description = found.description; filled.push('description') }

  // Handle publisher (needs resolution)
  if (!book.publishers?.name && found.publisher) {
    const { data: existing } = await supabaseAdmin
      .from('publishers')
      .select('id')
      .ilike('name', found.publisher)
      .maybeSingle()
    if (existing) {
      update.publisher_id = existing.id
    } else {
      const { data: created } = await supabaseAdmin
        .from('publishers')
        .insert({ name: found.publisher })
        .select('id')
        .single()
      if (created) update.publisher_id = created.id
    }
    if (update.publisher_id) filled.push('publisher')
  }

  // Handle author
  if (found.author) {
    const { data: existingLink } = await supabase
      .from('book_authors')
      .select('author_id')
      .eq('book_id', id)
      .maybeSingle()

    if (!existingLink) {
      const { data: existingAuthor } = await supabaseAdmin
        .from('authors')
        .select('id')
        .ilike('full_name', found.author)
        .maybeSingle()

      let author_id
      if (existingAuthor) {
        author_id = existingAuthor.id
      } else {
        const { data: created } = await supabaseAdmin
          .from('authors')
          .insert({ full_name: found.author, sort_name: found.author })
          .select('id')
          .single()
        author_id = created?.id
      }
      if (author_id) {
        await supabaseAdmin.from('book_authors').insert({ book_id: id, author_id, author_order: 1 })
        filled.push('author')
      }
    }
  }

  if (Object.keys(update).length > 0) {
    const { error } = await supabaseAdmin.from('books').update(update).eq('id', id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({
    filled, count: filled.length, source: found.source,
    _debug: {
      foundFields: Object.keys(found).filter(k => k !== 'source' && found[k] != null),
      bookBlanks: [
        !book.subtitle && 'subtitle',
        !book.publication_year && 'year',
        !book.page_count && 'pages',
        !book.language && 'language',
        !book.description && 'description',
        !book.isbn_13 && 'isbn_13',
        !book.isbn_10 && 'isbn_10',
        !book.publishers?.name && 'publisher',
      ].filter(Boolean),
    }
  })
}
