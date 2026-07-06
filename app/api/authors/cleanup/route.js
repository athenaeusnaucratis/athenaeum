import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
  if (!ANTHROPIC_KEY) return Response.json({ error: 'No API key' }, { status: 500 })

  const { data: authors } = await supabaseAdmin
    .from('authors')
    .select('id, full_name, sort_name')
    .order('full_name')

  if (!authors?.length) return Response.json({ error: 'No authors' }, { status: 404 })

  const names = authors.map(a => ({ id: a.id, name: a.full_name }))

  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: ANTHROPIC_KEY })

  // Process in batches of 80
  const batchSize = 80
  const allFixes = []

  for (let i = 0; i < names.length; i += batchSize) {
    const batch = names.slice(i, i + batchSize)
    const nameList = batch.map((n, idx) => `${idx}. "${n.name}"`).join('\n')

    const aiRes = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are cleaning up an author database for a cookbook library. For each author name below, determine:

1. Is this a real human author name? Flag as "delete" if it's:
   - Garbage/symbols ("—", "?", "##")
   - A publisher/organization ("Better Homes And Gardens", "Williams-Sonoma", "Cook's Illustrated Magazine", "Junior League")
   - Generic/unknown ("Various", "Author Unknown", "Miscellaneous", "Unknown")
   - Multiple authors crammed together with commas ("Bill Jamison, Cheryl Alters Jamison") — these should be split but for now flag as "split"

2. If it IS a valid human name, normalize it to "Firstname Lastname" format:
   - "Surname, Firstname" → "Firstname Surname"
   - "Chiarello Michael" → "Michael Chiarello"
   - Fix obvious encoding issues ("André" from "AndrÃ©")
   - Keep multi-part names natural: "Andoni Luis Aduriz" stays as is
   - If there are initials that seem truncated ("Henry A.", "Robert C."), keep as-is

3. Generate a proper sort_name in "Lastname, Firstname" format

Return a JSON array with ONLY entries that need changes. Each entry:
{"index": 0, "action": "fix"|"delete"|"split", "full_name": "corrected name", "sort_name": "Lastname, Firstname", "note": "reason"}

For "delete" entries, still include full_name/sort_name as-is.
For "split" entries, include full_name as the FIRST author only, and note the others.

If a name is already correct in "Firstname Lastname" format, DO NOT include it.

Names:
${nameList}

Return ONLY the JSON array, no explanation.`
      }],
    })

    const aiText = aiRes.content[0]?.text || ''
    const jsonMatch = aiText.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      try {
        const fixes = JSON.parse(jsonMatch[0])
        for (const fix of fixes) {
          const author = batch[fix.index]
          if (author) {
            allFixes.push({ ...fix, id: author.id, original: author.name })
          }
        }
      } catch (e) {
        console.error('JSON parse error in batch', i, e.message)
      }
    }
  }

  return Response.json({ fixes: allFixes, total: authors.length })
}

// Apply fixes
export async function PATCH(request) {
  const { fixes } = await request.json()
  if (!fixes?.length) return Response.json({ error: 'No fixes provided' }, { status: 400 })

  const results = { updated: 0, deleted: 0, errors: [] }

  for (const fix of fixes) {
    try {
      if (fix.action === 'delete') {
        // Remove book_authors links first, then delete author
        await supabaseAdmin.from('book_authors').delete().eq('author_id', fix.id)
        await supabaseAdmin.from('authors').delete().eq('id', fix.id)
        results.deleted++
      } else if (fix.action === 'fix' || fix.action === 'split') {
        await supabaseAdmin
          .from('authors')
          .update({ full_name: fix.full_name, sort_name: fix.sort_name })
          .eq('id', fix.id)
        results.updated++
      }
    } catch (e) {
      results.errors.push({ id: fix.id, error: e.message })
    }
  }

  return Response.json(results)
}
