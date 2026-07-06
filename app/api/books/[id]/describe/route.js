import { supabase } from '@/lib/supabase'

async function fetchOpenLibraryDescription(isbn, title) {
  if (!isbn && !title) return null
  try {
    if (isbn) {
      const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`, { cache: 'no-store' })
      if (res.ok) {
        const ol = await res.json()
        if (ol.works?.[0]?.key) {
          const workRes = await fetch(`https://openlibrary.org${ol.works[0].key}.json`, { cache: 'no-store' })
          if (workRes.ok) {
            const work = await workRes.json()
            const desc = typeof work.description === 'string' ? work.description : work.description?.value
            if (desc) return desc
          }
        }
      }
    }
    if (title) {
      const res = await fetch(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=3&fields=key,title`,
        { cache: 'no-store' }
      )
      if (res.ok) {
        const search = await res.json()
        const first = search.docs?.[0]
        if (first?.key) {
          const workRes = await fetch(`https://openlibrary.org${first.key}.json`, { cache: 'no-store' })
          if (workRes.ok) {
            const work = await workRes.json()
            const desc = typeof work.description === 'string' ? work.description : work.description?.value
            if (desc) return desc
          }
        }
      }
    }
  } catch {}
  return null
}

async function fetchGoogleBooksDescription(isbn, title) {
  try {
    const query = isbn ? `isbn:${isbn}` : `intitle:${encodeURIComponent(title || '')}`
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    return json.items?.[0]?.volumeInfo?.description || null
  } catch { return null }
}

export async function POST(request, { params }) {
  const { id } = await params
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
  if (!ANTHROPIC_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const { data: book } = await supabase
    .from('books')
    .select(`
      id, title, subtitle, isbn_13, isbn_10, publication_year, language,
      country_of_origin, format, description,
      publishers(name),
      authors:book_authors(authors(full_name))
    `)
    .eq('id', id)
    .single()

  if (!book) return Response.json({ error: 'Book not found' }, { status: 404 })

  const isbn = book.isbn_13 || book.isbn_10
  const authorList = book.authors?.map(a => a.authors?.full_name).filter(Boolean) || []
  const publisher = book.publishers?.name

  // Pull fresh source descriptions in parallel
  const [olDesc, gbDesc] = await Promise.all([
    fetchOpenLibraryDescription(isbn, book.title),
    fetchGoogleBooksDescription(isbn, book.title),
  ])

  const context = [
    `Title: ${book.title}`,
    book.subtitle && `Subtitle: ${book.subtitle}`,
    authorList.length && `Author(s): ${authorList.join(', ')}`,
    publisher && `Publisher: ${publisher}`,
    book.publication_year && `Year: ${book.publication_year}`,
    isbn && `ISBN: ${isbn}`,
    book.language && `Language: ${book.language}`,
    book.country_of_origin && `Country: ${book.country_of_origin}`,
    book.format && `Format: ${book.format}`,
  ].filter(Boolean).join('\n')

  const sources = []
  if (book.description) sources.push(`Current saved description:\n${book.description}`)
  if (olDesc) sources.push(`Open Library description:\n${olDesc}`)
  if (gbDesc) sources.push(`Google Books description:\n${gbDesc}`)

  const sourceText = sources.length
    ? `\n\nReference text from external sources (use as factual grounding, but rewrite — do not just copy):\n\n${sources.join('\n\n---\n\n')}`
    : ''

  const prompt = `You are a cookbook librarian writing a polished description for a personal cookbook collection.

Book metadata:
${context}
${sourceText}

Write a 2-4 sentence description of this cookbook covering:
- What cuisine, region, or culinary tradition it focuses on
- The type of cook it's aimed at (home cook, professional, beginner, etc.) and the format (recipes, narrative, reference, technique-driven)
- What makes it notable, distinctive, or historically significant if applicable

Rules:
- Write in factual, neutral library-catalog prose. No marketing fluff ("must-have", "essential", "captivating") and no first-person.
- Do not invent specifics (number of recipes, awards, anecdotes) unless they appear in the metadata or source text.
- If source text contains marketing language or HTML, rewrite into clean prose.
- If you have no real knowledge of this specific book AND no source text was provided, infer cautiously from the title and metadata only. Stay general — describe what a book of this title likely covers — rather than fabricating details.
- Output the description text only. No preamble, no quotes, no JSON.`

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: ANTHROPIC_KEY })

    const aiRes = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (aiRes.content[0]?.text || '').trim()
    if (!text) return Response.json({ error: 'Empty response from AI' }, { status: 500 })

    return Response.json({
      description: text,
      sources: {
        openLibrary: !!olDesc,
        googleBooks: !!gbDesc,
        previous: !!book.description,
      },
    })
  } catch (e) {
    return Response.json({ error: e.message || 'AI request failed' }, { status: 500 })
  }
}
