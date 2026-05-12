import { supabase, supabaseAdmin } from '@/lib/supabase'

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

  // 1. Try Google Books by ISBN
  if (isbn) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`,
        { cache: 'no-store' }
      )
      const json = await res.json()
      const item = json.items?.[0]?.volumeInfo
      if (item) {
        Object.assign(result, extractFromGoogleBooks(item))
        sources.push('google_books')
      }
    } catch (e) { console.error('Google Books ISBN error:', e.message) }
  }

  // 2. Enrich with Open Library (often has better covers/page counts)
  if (isbn) {
    try {
      const res = await fetch(
        `https://openlibrary.org/isbn/${isbn}.json`,
        { cache: 'no-store' }
      )
      if (res.ok) {
        const ol = await res.json()
        if (!result.page_count) result.page_count = ol.number_of_pages || null
        if (!result.publisher) result.publisher = ol.publishers?.[0] || null
        if (!result.publication_year && ol.publish_date) result.publication_year = parseInt(ol.publish_date)
        if (!result.cover_image_url && ol.covers?.[0]) {
          result.cover_image_url = `https://covers.openlibrary.org/b/id/${ol.covers[0]}-M.jpg`
        }
        if (!result.isbn_13) result.isbn_13 = ol.isbn_13?.[0] || null
        if (!result.isbn_10) result.isbn_10 = ol.isbn_10?.[0] || null

        if (!result.author && ol.authors?.[0]?.key) {
          try {
            const authorRes = await fetch(`https://openlibrary.org${ol.authors[0].key}.json`)
            const authorData = await authorRes.json()
            result.author = authorData.name || null
          } catch {}
        }

        // Get description from Open Library Works endpoint
        if (!result.description && ol.works?.[0]?.key) {
          try {
            const workRes = await fetch(`https://openlibrary.org${ol.works[0].key}.json`)
            const work = await workRes.json()
            const desc = typeof work.description === 'string'
              ? work.description
              : work.description?.value || null
            if (desc) result.description = desc
          } catch {}
        }
        sources.push('open_library')
      }
    } catch (e) { console.error('Open Library error:', e.message) }
  }

  // 3. Always try Google Books by title to fill gaps (not just when ISBN fails)
  if (title) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=3`,
        { cache: 'no-store' }
      )
      const json = await res.json()
      for (const vol of json.items ?? []) {
        const item = vol.volumeInfo
        if (!item) continue
        const gb = extractFromGoogleBooks(item)
        // Validate title match before using
        if (!isSimilar(gb.title, title)) continue
        // Only fill fields that are still missing
        if (!result.title && gb.title) result.title = gb.title
        if (!result.subtitle && gb.subtitle) result.subtitle = gb.subtitle
        if (!result.author && gb.author) result.author = gb.author
        if (!result.publisher && gb.publisher) result.publisher = gb.publisher
        if (!result.publication_year && gb.publication_year) result.publication_year = gb.publication_year
        if (!result.page_count && gb.page_count) result.page_count = gb.page_count
        if (!result.language && gb.language) result.language = gb.language
        if (!result.cover_image_url && gb.cover_image_url) result.cover_image_url = gb.cover_image_url
        if (!result.description && gb.description) result.description = gb.description
        if (!sources.includes('google_books_title')) sources.push('google_books_title')
        break // use first validated match
      }
    } catch (e) { console.error('Google Books title error:', e.message) }
  }

  // 4. Try Open Library search by title (for books without ISBN)
  if (!result.description && title) {
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=3&fields=key,title`,
        { cache: 'no-store' }
      )
      if (res.ok) {
        const search = await res.json()
        // Find first result with matching title
        const match = (search.docs ?? []).find(d => isSimilar(d.title, title))
        if (match?.key) {
          const workRes = await fetch(`https://openlibrary.org${match.key}.json`)
          const work = await workRes.json()
          const desc = typeof work.description === 'string'
            ? work.description
            : work.description?.value || null
          if (desc) {
            result.description = desc
            if (!sources.includes('open_library')) sources.push('open_library')
          }
          if (!result.cover_image_url && work.covers?.[0]) {
            result.cover_image_url = `https://covers.openlibrary.org/b/id/${work.covers[0]}-M.jpg`
          }
        }
      }
    } catch (e) { console.error('Open Library search error:', e.message) }
  }

  // 5. Library of Congress — good for publisher, year, language, subjects
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
        // For title searches, validate the match; ISBN searches are trusted
        const item = !isbn
          ? (loc.results ?? []).find(r => isSimilar(r.title, title))
          : loc.results?.[0]
        if (item) {
          if (!result.publisher) {
            const pub = item.contributor?.find(c => c)
              || item.item?.contributors?.[0]
              || null
            // LOC stores publisher in different places
            const pubName = item.item?.created_published
            if (pubName) {
              // Extract publisher from "Publisher, Year" format
              const parts = pubName.split(',')
              if (parts.length > 1 && !result.publisher) {
                const cleaned = parts[0].replace(/[\[\]]/g, '').trim()
                if (cleaned.length > 2) result.publisher = cleaned
              }
            }
          }
          if (!result.publication_year && item.date) {
            const year = parseInt(item.date)
            if (year > 1800 && year < 2100) result.publication_year = year
          }
          if (!result.language) {
            const lang = item.language?.[0]
            if (lang) {
              // LOC uses full names, convert common ones
              const langMap = { english: 'en', french: 'fr', spanish: 'es', german: 'de', italian: 'it', japanese: 'ja', chinese: 'zh', turkish: 'tr', portuguese: 'pt', dutch: 'nl', russian: 'ru' }
              result.language = langMap[lang.toLowerCase()] || lang.substring(0, 2).toLowerCase()
            }
          }
          if (!result.description && item.description?.[0]) {
            result.description = item.description[0]
          }
          sources.push('loc')
        }
      }
    } catch (e) { console.error('Library of Congress error:', e.message) }
  }

  result.source = sources.join('+') || null

  // Check if we got any actual data (not just the source tag)
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
    return Response.json({ error: 'No metadata found', filled: [], count: 0 }, { status: 200 })
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

  return Response.json({ filled, count: filled.length, source: found.source })
}
