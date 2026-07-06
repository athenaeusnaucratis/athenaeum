import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function POST(request, { params }) {
  const { id } = await params
  const { target } = await request.json()

  if (target !== 'chef') {
    return Response.json({ error: 'target must be "chef"' }, { status: 400 })
  }

  const { data: author } = await supabase
    .from('authors')
    .select('id, full_name, sort_name, bio, photo_url, nationality, birth_year, notes')
    .eq('id', id)
    .single()

  if (!author) return Response.json({ error: 'Author not found' }, { status: 404 })

  // Find or create the chef
  const { data: existingChef } = await supabaseAdmin
    .from('chefs')
    .select('id')
    .ilike('full_name', author.full_name)
    .maybeSingle()

  let chefId
  let existed = false
  if (existingChef) {
    chefId = existingChef.id
    existed = true
  } else {
    const { data: created, error } = await supabaseAdmin
      .from('chefs')
      .insert({
        full_name: author.full_name,
        sort_name: author.sort_name || author.full_name,
        bio: author.bio,
        photo_url: author.photo_url,
        nationality: author.nationality,
        birth_year: author.birth_year,
        notes: author.notes,
      })
      .select('id')
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    chefId = created.id
  }

  // Mirror the author's books into book_chefs so the chef page shows them too
  const { data: authorBooks } = await supabaseAdmin
    .from('book_authors')
    .select('book_id, author_order')
    .eq('author_id', id)

  let linkedBooks = 0
  if (authorBooks?.length) {
    // Check which of these books are already linked to this chef, to avoid dupes
    const bookIds = authorBooks.map(b => b.book_id)
    const { data: existingLinks } = await supabaseAdmin
      .from('book_chefs')
      .select('book_id')
      .eq('chef_id', chefId)
      .in('book_id', bookIds)

    const alreadyLinked = new Set((existingLinks || []).map(l => l.book_id))
    const toInsert = authorBooks
      .filter(b => !alreadyLinked.has(b.book_id))
      .map(b => ({
        book_id: b.book_id,
        chef_id: chefId,
        chef_order: b.author_order ?? 1,
      }))

    if (toInsert.length) {
      const { error: linkError } = await supabaseAdmin.from('book_chefs').insert(toInsert)
      if (!linkError) linkedBooks = toInsert.length
    }
  }

  return Response.json({ id: chefId, existed, linkedBooks })
}
