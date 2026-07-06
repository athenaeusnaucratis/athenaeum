import { normalizeLanguage, parseYear } from '@/lib/books'

// Enrich OCR result by looking up the book on Google Books, then Open Library
async function enrichFromCatalogs(title, author) {
  if (!title) return {}
  const cleanTitle = title.trim().replace(/\s+/g, ' ')
  const q = author
    ? `intitle:${encodeURIComponent(cleanTitle)}+inauthor:${encodeURIComponent(author)}`
    : `intitle:${encodeURIComponent(cleanTitle)}`

  // Google Books
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=3`,
      { cache: 'no-store' }
    )
    if (res.ok) {
      const json = await res.json()
      const item = json.items?.[0]?.volumeInfo
      if (item) {
        const isbn13 = item.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier
        const isbn10 = item.industryIdentifiers?.find(i => i.type === 'ISBN_10')?.identifier
        return {
          publication_year: parseYear(item.publishedDate),
          page_count: item.pageCount || null,
          language: normalizeLanguage(item.language),
          cover_image_url: item.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
          isbn_13: isbn13 || null,
          isbn_10: isbn10 || null,
          _enriched_via: 'google_books',
        }
      }
    }
  } catch {}

  // Open Library search
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(cleanTitle)}&limit=3&fields=key,title,author_name,publisher,first_publish_year,number_of_pages_median,isbn,cover_i,language`,
      { cache: 'no-store' }
    )
    if (res.ok) {
      const search = await res.json()
      const doc = search.docs?.[0]
      if (doc) {
        return {
          publication_year: parseYear(doc.first_publish_year),
          page_count: doc.number_of_pages_median || null,
          language: normalizeLanguage(doc.language?.[0]),
          cover_image_url: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
          isbn_13: (doc.isbn || []).find(i => i.length === 13) || null,
          isbn_10: (doc.isbn || []).find(i => i.length === 10) || null,
          _enriched_via: 'open_library',
        }
      }
    }
  } catch {}

  return {}
}

// Merge enrichment into the extracted OCR result — only fill blanks
function mergeEnrichment(base, enriched) {
  const out = { ...base }
  for (const [k, v] of Object.entries(enriched)) {
    if (k.startsWith('_')) continue
    if (v != null && v !== '' && !out[k]) out[k] = v
  }
  return out
}

export async function POST(request) {
  const VISION_KEY = process.env.GOOGLE_VISION_API_KEY
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

  if (!VISION_KEY && !ANTHROPIC_KEY) {
    return Response.json({ error: 'No OCR API keys configured' }, { status: 500 })
  }

  let formData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !file.size) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: 'Image too large (max 10MB)' }, { status: 400 })
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const mediaType = file.type || 'image/jpeg'

  let base64
  try {
    const bytes = await file.arrayBuffer()
    base64 = Buffer.from(bytes).toString('base64')
  } catch {
    return Response.json({ error: 'Failed to read image file' }, { status: 500 })
  }

  // ── Try Google Vision first ──
  let ocrText = ''
  let webEntities = []
  let bestGuess = ''
  let matchingPageTitles = []
  let visionWorked = false

  if (VISION_KEY) {
    try {
      const visionRes = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${VISION_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              image: { content: base64 },
              features: [
                { type: 'TEXT_DETECTION', maxResults: 1 },
                { type: 'WEB_DETECTION', maxResults: 10 },
              ],
            }],
          }),
        }
      )

      if (visionRes.ok) {
        const visionData = await visionRes.json()
        const response = visionData.responses?.[0]

        if (response && !response.error) {
          visionWorked = true
          ocrText = response.fullTextAnnotation?.text || ''
          const wd = response.webDetection || {}
          bestGuess = (wd.bestGuessLabels || []).map(l => l.label).join(', ')
          webEntities = (wd.webEntities || [])
            .filter(e => e.description && e.score > 0.3)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)
            .map(e => e.description)
          matchingPageTitles = (wd.pagesWithMatchingImages || [])
            .slice(0, 5)
            .map(p => p.pageTitle)
            .filter(Boolean)
        }
      }
    } catch (e) {
      console.error('Vision API error:', e.message)
    }
  }

  const RICH_SCHEMA = `{
  "title": "",
  "subtitle": "",
  "author": "",
  "publisher": "",
  "publication_year": null,
  "edition": "",
  "isbn": "",
  "language": ""
}`

  // ── Use Claude to interpret (with or without Vision data) ──
  if (ANTHROPIC_KEY) {
    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic({ apiKey: ANTHROPIC_KEY })

      let extracted = null

      if (visionWorked) {
        const prompt = `You are identifying a cookbook from its cover photo.

DATA EXTRACTED FROM COVER:

OCR TEXT:
${ocrText || '(no text detected)'}

GOOGLE BEST GUESS:
${bestGuess || '(none)'}

WEB ENTITIES (by relevance):
${webEntities.join(', ') || '(none)'}

MATCHING PAGE TITLES:
${matchingPageTitles.join('\n') || '(none)'}

Task: identify this cookbook precisely and return metadata as JSON.

Rules:
- Use the OCR text as the primary source of truth for what appears on the cover.
- Cross-reference with your own knowledge — if the OCR text and web entities match a well-known cookbook you recognize, use your knowledge to fill fields that aren't on the cover (e.g. publisher, year).
- "title" and "subtitle" — split cleanly. If only one is present, put it in title.
- "author" — the chef or writer, not co-authors or forewords. Use the full name.
- "publisher" — the imprint on the cover, or from your knowledge if unambiguous.
- "publication_year" — 4-digit year if you can determine it (visible copyright date OR from your knowledge). Otherwise null.
- "edition" — "First Edition", "10th Anniversary", "Revised", etc. Only if clearly stated.
- "isbn" — only if visibly printed on the front cover. Rare. Empty otherwise.
- "language" — the full English name of the book's language: "English", "French", "Turkish", etc. Empty if unclear.

Return ONLY the JSON object matching this schema:
${RICH_SCHEMA}`

        const aiRes = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 600,
          messages: [{ role: 'user', content: prompt }],
        })

        const aiText = aiRes.content[0]?.text || ''
        const jsonMatch = aiText.match(/\{[\s\S]*\}/)
        if (jsonMatch) extracted = JSON.parse(jsonMatch[0])
      } else {
        if (!validTypes.includes(mediaType)) {
          return Response.json({ error: `Unsupported image type: ${mediaType}` }, { status: 400 })
        }

        const prompt = `Look at this cookbook cover photo. Identify the book precisely.

Task: extract as much metadata as you can see or reliably infer, and return JSON.

Rules:
- Read every piece of text on the cover carefully (title, subtitle, author, publisher, edition line, ISBN if visible).
- If you recognize the book from your knowledge, use that to fill fields that aren't on the cover (e.g. publisher, year, language).
- "title" and "subtitle" — split cleanly. Don't merge them.
- "author" — the chef or writer, full name. Not co-authors or foreword writers.
- "publisher" — the imprint on the cover or from your knowledge.
- "publication_year" — 4-digit year from the cover copyright OR from your knowledge. Otherwise null.
- "edition" — only if clearly stated (e.g. "First Edition", "Revised", "10th Anniversary").
- "isbn" — only if visibly printed. Empty otherwise.
- "language" — full English name: "English", "French", "Turkish", etc. Empty if unclear.

Return ONLY the JSON object matching this schema:
${RICH_SCHEMA}`

        const aiRes = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 700,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
              { type: 'text', text: prompt },
            ],
          }],
        })

        const aiText = aiRes.content[0]?.text || ''
        const jsonMatch = aiText.match(/\{[\s\S]*\}/)
        if (jsonMatch) extracted = JSON.parse(jsonMatch[0])
      }

      if (extracted) {
        // Normalize field types + names
        const rawIsbn = (extracted.isbn || '').replace(/[^0-9Xx]/g, '')
        const base = {
          title: extracted.title || '',
          subtitle: extracted.subtitle || '',
          author: extracted.author || '',
          publisher: extracted.publisher || '',
          publication_year: parseYear(extracted.publication_year),
          edition: extracted.edition || '',
          isbn_13: rawIsbn.length === 13 ? rawIsbn : null,
          isbn_10: rawIsbn.length === 10 ? rawIsbn : null,
          language: normalizeLanguage(extracted.language),
        }

        // Enrich blanks from Google Books / Open Library via title+author
        const enriched = await enrichFromCatalogs(base.title, base.author)
        const merged = mergeEnrichment(base, enriched)

        return Response.json({
          ...merged,
          _source: visionWorked ? 'vision+claude' : 'claude_vision',
          _enriched_via: enriched._enriched_via || null,
        })
      }
    } catch (e) {
      console.error('Claude OCR error:', e.message)
      return Response.json({ error: `OCR failed: ${e.message}` }, { status: 500 })
    }
  }

  // Fallback: return whatever Vision gave us
  if (visionWorked) {
    return Response.json({
      title: bestGuess || webEntities[0] || '',
      subtitle: '',
      author: '',
      publisher: '',
      _source: 'vision_only',
    })
  }

  return Response.json({ error: 'All OCR methods failed' }, { status: 500 })
}
