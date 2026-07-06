import { supabase } from '@/lib/supabase'

function isSimilar(a, b) {
  const na = (a || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const nb = (b || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!na || !nb) return false
  return na.includes(nb) || nb.includes(na)
}

async function fetchOpenLibraryBio(name) {
  try {
    const res = await fetch(
      `https://openlibrary.org/search/authors.json?q=${encodeURIComponent(name)}&limit=5`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    const data = await res.json()
    const match = (data.docs ?? []).find(d => isSimilar(d.name, name))
    if (!match) return null
    const detailRes = await fetch(`https://openlibrary.org/authors/${match.key}.json`, { cache: 'no-store' })
    if (!detailRes.ok) return null
    const author = await detailRes.json()
    const bio = typeof author.bio === 'string' ? author.bio : author.bio?.value
    return bio || null
  } catch { return null }
}

async function fetchWikipediaBio(name) {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.replace(/\s+/g, '_'))}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    const wiki = await res.json()
    if (wiki.type !== 'standard' || !wiki.extract) return null
    const desc = (wiki.description || '').toLowerCase()
    const extract = (wiki.extract || '').toLowerCase()
    const isFoodPerson = /writer|author|chef|cook|baker|restaurat|food|culinary|gastronom|recipe/i.test(desc + ' ' + extract)
    if (!isFoodPerson && !isSimilar(wiki.title, name)) return null
    return wiki.extract
  } catch { return null }
}

async function fetchAuthorBooks(authorId) {
  try {
    const { data } = await supabase
      .from('book_authors')
      .select('books(title, publication_year)')
      .eq('author_id', authorId)
      .limit(15)
    return (data || []).map(d => d.books).filter(Boolean)
  } catch { return [] }
}

export async function POST(request, { params }) {
  const { id } = await params
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
  if (!ANTHROPIC_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const { data: author } = await supabase
    .from('authors')
    .select('id, full_name, bio, birth_year, nationality')
    .eq('id', id)
    .single()

  if (!author) return Response.json({ error: 'Author not found' }, { status: 404 })

  // Pull fresh sources in parallel
  const [olBio, wikiBio, books] = await Promise.all([
    fetchOpenLibraryBio(author.full_name),
    fetchWikipediaBio(author.full_name),
    fetchAuthorBooks(id),
  ])

  const context = [
    `Name: ${author.full_name}`,
    author.nationality && `Nationality: ${author.nationality}`,
    author.birth_year && `Birth year: ${author.birth_year}`,
  ].filter(Boolean).join('\n')

  const bookList = books.length
    ? `\n\nBooks by this author in the collection:\n${books.map(b => `- ${b.title}${b.publication_year ? ` (${b.publication_year})` : ''}`).join('\n')}`
    : ''

  const sources = []
  if (author.bio) sources.push(`Current saved bio:\n${author.bio}`)
  if (wikiBio) sources.push(`Wikipedia extract:\n${wikiBio}`)
  if (olBio) sources.push(`Open Library bio:\n${olBio}`)

  const sourceText = sources.length
    ? `\n\nReference text from external sources (use as factual grounding, rewrite — do not just copy):\n\n${sources.join('\n\n---\n\n')}`
    : ''

  const prompt = `You are a cookbook librarian writing a polished biographical note for a personal cookbook collection.

Author metadata:
${context}${bookList}
${sourceText}

Write a 3-4 sentence biography covering:
- Their culinary focus, cuisine, or area of expertise (regional cooking, baking, technique, food writing, etc.)
- Career highlights or what they are known for (notable cookbooks, restaurants, TV shows, journalism, awards)
- Any distinctive style, approach, or contribution to food writing

Rules:
- Write in factual, neutral library-catalog prose. No marketing fluff ("renowned", "celebrated", "must-read") and no first-person.
- Do not invent specifics (dates, awards, restaurants, anecdotes) unless they appear in the metadata or source text.
- If source text contains marketing language, rewrite into clean prose.
- If you have no real knowledge of this specific author AND no source text was provided, infer cautiously from the name and the books in the collection. Stay general — describe what kind of cooking these books suggest the author works in — rather than fabricating biographical details.
- Output the bio text only. No preamble, no quotes, no JSON.`

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
      bio: text,
      sources: {
        openLibrary: !!olBio,
        wikipedia: !!wikiBio,
        previous: !!author.bio,
        bookCount: books.length,
      },
    })
  } catch (e) {
    return Response.json({ error: e.message || 'AI request failed' }, { status: 500 })
  }
}
