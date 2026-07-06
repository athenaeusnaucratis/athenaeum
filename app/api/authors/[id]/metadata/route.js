import { supabase, supabaseAdmin } from '@/lib/supabase'

function norm(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function isSimilar(a, b) {
  const na = norm(a)
  const nb = norm(b)
  if (!na || !nb) return false
  if (na.includes(nb) || nb.includes(na)) return true
  const wordsA = (a || '').toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const wordsB = (b || '').toLowerCase().split(/\s+/).filter(w => w.length > 2)
  if (!wordsA.length || !wordsB.length) return false
  let overlap = 0
  for (const w of wordsA) { if (wordsB.some(wb => wb.includes(w) || w.includes(wb))) overlap++ }
  return overlap / Math.max(wordsA.length, wordsB.length) > 0.5
}

async function lookupAuthorMetadata(name) {
  const result = {}
  const sources = []

  // 1. Open Library author search
  try {
    const res = await fetch(
      `https://openlibrary.org/search/authors.json?q=${encodeURIComponent(name)}&limit=5`,
      { cache: 'no-store' }
    )
    if (res.ok) {
      const data = await res.json()
      const match = (data.docs ?? []).find(d => isSimilar(d.name, name))
      if (match) {
        // Get full author details
        const detailRes = await fetch(`https://openlibrary.org/authors/${match.key}.json`)
        if (detailRes.ok) {
          const author = await detailRes.json()
          const bio = typeof author.bio === 'string'
            ? author.bio
            : author.bio?.value || null
          if (bio) result.bio = bio

          if (author.birth_date) {
            const year = parseInt(author.birth_date)
            if (year > 1000 && year < 2100) result.birth_year = year
          }

          if (author.photos?.[0]) {
            result.photo_url = `https://covers.openlibrary.org/a/id/${author.photos[0]}-M.jpg`
          }

          sources.push('open_library')
        }
      }
    }
  } catch (e) { console.error('OL author search error:', e.message) }

  // 2. Wikipedia API — often has better bios
  if (!result.bio) {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.replace(/\s+/g, '_'))}`,
        { cache: 'no-store' }
      )
      if (res.ok) {
        const wiki = await res.json()
        if (wiki.type === 'standard' && wiki.extract) {
          // Validate it's about the right person
          const desc = (wiki.description || '').toLowerCase()
          const extract = (wiki.extract || '').toLowerCase()
          const isAuthor = /writer|author|chef|cook|baker|restaurat|food|culinary|gastronom/i.test(desc + ' ' + extract)
          if (isAuthor || isSimilar(wiki.title, name)) {
            result.bio = wiki.extract
            if (!result.photo_url && wiki.thumbnail?.source) {
              result.photo_url = wiki.thumbnail.source
            }
            // Try to extract birth year from description
            if (!result.birth_year) {
              const birthMatch = extract.match(/\bborn\s+(?:\w+\s+\d{1,2},?\s+)?(\d{4})\b/)
                || extract.match(/\((\d{4})\s*[–-]/)
              if (birthMatch) {
                const y = parseInt(birthMatch[1])
                if (y > 1000 && y < 2100) result.birth_year = y
              }
            }
            sources.push('wikipedia')
          }
        }
      }
    } catch (e) { console.error('Wikipedia error:', e.message) }
  }

  // 3. Google Books — search by author, extract info from results
  if (!result.bio) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=inauthor:${encodeURIComponent(name)}&maxResults=1`,
        { cache: 'no-store' }
      )
      const json = await res.json()
      const item = json.items?.[0]?.volumeInfo
      if (item?.authors?.some(a => isSimilar(a, name))) {
        // Google Books doesn't have author bios, but can confirm the author exists
        // and provide a photo URL via the book cover as fallback
        if (!result.photo_url && item.imageLinks?.thumbnail) {
          // Don't use book cover as author photo — skip this
        }
        sources.push('google_books')
      }
    } catch (e) { console.error('Google Books author error:', e.message) }
  }

  // 4. Claude AI — generate bio, fill nationality, birth year
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
  const missingAuthorFields = []
  if (!result.bio) missingAuthorFields.push('bio')
  if (!result.birth_year) missingAuthorFields.push('birth_year')
  if (!result.nationality) missingAuthorFields.push('nationality')

  if (ANTHROPIC_KEY && missingAuthorFields.length > 0) {
    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic({ apiKey: ANTHROPIC_KEY })

      const aiRes = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `You are a book reference librarian. I need information about the cookbook author "${name}".

Provide the following fields: ${missingAuthorFields.join(', ')}

For "bio": write a 3-4 sentence biography focused on their culinary career, notable cookbooks, cooking style, and achievements. Be factual — if you don't recognize this author, say so honestly.
For "nationality": use the country name (e.g. "American", "British", "French").
For "birth_year": the year they were born as an integer.

Return ONLY a JSON object. Use null for anything you cannot determine with confidence.
{"bio": "...", "birth_year": 1950, "nationality": "American"}

Return ONLY the JSON, no explanation.`
        }],
      })

      const aiText = aiRes.content[0]?.text || ''
      const jsonMatch = aiText.match(/\{[\s\S]*?\}/)
      if (jsonMatch) {
        const ai = JSON.parse(jsonMatch[0])
        if (!result.bio && ai.bio && ai.bio !== 'null' && !/do not recognize|don't recognize|not familiar|cannot determine|cannot provide|not able to|unable to verify|cannot verify|not recognize/i.test(ai.bio)) {
          result.bio = ai.bio
        }
        if (!result.birth_year && ai.birth_year) result.birth_year = parseInt(ai.birth_year)
        if (!result.nationality && ai.nationality && ai.nationality !== 'null') result.nationality = ai.nationality
        sources.push('claude')
      }
    } catch (e) { console.error('Claude author enrichment error:', e.message) }
  }

  result.source = sources.join('+') || null
  const dataKeys = Object.keys(result).filter(k => k !== 'source' && result[k] != null)
  return dataKeys.length > 0 ? result : null
}

export async function POST(request, { params }) {
  const { id } = await params

  const { data: author } = await supabase
    .from('authors')
    .select('id, full_name, bio, birth_year, photo_url, nationality')
    .eq('id', id)
    .single()

  if (!author) return Response.json({ error: 'Author not found' }, { status: 404 })

  const found = await lookupAuthorMetadata(author.full_name)

  if (!found) {
    return Response.json({ error: 'No metadata found', filled: [], count: 0 }, { status: 200 })
  }

  const update = {}
  const filled = []

  if (!author.bio && found.bio) { update.bio = found.bio; filled.push('bio') }
  if (!author.birth_year && found.birth_year) { update.birth_year = found.birth_year; filled.push('birth_year') }
  if (!author.photo_url && found.photo_url) { update.photo_url = found.photo_url; filled.push('photo') }
  if (!author.nationality && found.nationality) { update.nationality = found.nationality; filled.push('nationality') }

  if (Object.keys(update).length > 0) {
    const { error } = await supabaseAdmin.from('authors').update(update).eq('id', id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ filled, count: filled.length, source: found.source })
}
