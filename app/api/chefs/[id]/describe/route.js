import { supabase } from '@/lib/supabase'

function isSimilar(a, b) {
  const na = (a || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const nb = (b || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!na || !nb) return false
  return na.includes(nb) || nb.includes(na)
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
    const isChefRelated = /chef|cook|restaurant|cuisine|culinary|gastronom|patiss|baker|food|michelin/i.test(desc + ' ' + extract)
    if (!isChefRelated && !isSimilar(wiki.title, name)) return null
    return wiki.extract
  } catch { return null }
}

async function fetchLinkedBooks(chefId) {
  try {
    const { data } = await supabase
      .from('book_chefs')
      .select('books(title, publication_year)')
      .eq('chef_id', chefId)
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

  const { data: chef } = await supabase
    .from('chefs')
    .select('id, full_name, bio, nationality, birth_year, death_year, restaurants, specialties')
    .eq('id', id)
    .single()

  if (!chef) return Response.json({ error: 'Chef not found' }, { status: 404 })

  const [wikiBio, books] = await Promise.all([
    fetchWikipediaBio(chef.full_name),
    fetchLinkedBooks(id),
  ])

  const context = [
    `Name: ${chef.full_name}`,
    chef.nationality && `Nationality: ${chef.nationality}`,
    chef.birth_year && `Birth year: ${chef.birth_year}`,
    chef.death_year && `Death year: ${chef.death_year}`,
    chef.restaurants && `Restaurants: ${chef.restaurants}`,
    chef.specialties && `Specialties: ${chef.specialties}`,
  ].filter(Boolean).join('\n')

  const bookList = books.length
    ? `\n\nBooks by or about this chef in the collection:\n${books.map(b => `- ${b.title}${b.publication_year ? ` (${b.publication_year})` : ''}`).join('\n')}`
    : ''

  const sources = []
  if (chef.bio) sources.push(`Current saved bio:\n${chef.bio}`)
  if (wikiBio) sources.push(`Wikipedia extract:\n${wikiBio}`)

  const sourceText = sources.length
    ? `\n\nReference text from external sources (use as factual grounding, rewrite — do not just copy):\n\n${sources.join('\n\n---\n\n')}`
    : ''

  const prompt = `You are a cookbook librarian writing a polished biographical note for a personal cookbook collection's chef profile.

Chef metadata:
${context}${bookList}
${sourceText}

Write a 3-4 sentence biography covering:
- Their cuisine, technique, or culinary tradition (French classical, Nordic, Sichuanese, pastry, etc.)
- Career highlights (restaurants, Michelin stars, TV work, mentors, cookbooks)
- Their distinctive contribution, style, or influence on cooking

Rules:
- Write in factual, neutral library-catalog prose. No marketing fluff ("world-renowned", "legendary", "must-visit") and no first-person.
- Do not invent specifics (star counts, dates, restaurant names, awards) unless they appear in the metadata or source text.
- If source text contains marketing language, rewrite into clean prose.
- If you have no real knowledge of this specific chef AND no source text was provided, infer cautiously from the name and books listed. Stay general rather than fabricating.
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
      sources: { wikipedia: !!wikiBio, previous: !!chef.bio, bookCount: books.length },
    })
  } catch (e) {
    return Response.json({ error: e.message || 'AI request failed' }, { status: 500 })
  }
}
