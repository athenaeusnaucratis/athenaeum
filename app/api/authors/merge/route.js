import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  const { keep_id, remove_id } = await request.json()
  if (!keep_id || !remove_id) return Response.json({ error: 'keep_id and remove_id required' }, { status: 400 })

  // Re-assign all book_authors from remove to keep
  const { data: links } = await supabaseAdmin
    .from('book_authors')
    .select('book_id')
    .eq('author_id', remove_id)

  for (const link of links ?? []) {
    // Check if the keep author already linked to this book
    const { data: existing } = await supabaseAdmin
      .from('book_authors')
      .select('id')
      .eq('book_id', link.book_id)
      .eq('author_id', keep_id)
      .maybeSingle()

    if (!existing) {
      await supabaseAdmin
        .from('book_authors')
        .update({ author_id: keep_id })
        .eq('book_id', link.book_id)
        .eq('author_id', remove_id)
    } else {
      // Already linked, just delete the duplicate
      await supabaseAdmin
        .from('book_authors')
        .delete()
        .eq('book_id', link.book_id)
        .eq('author_id', remove_id)
    }
  }

  // Delete the duplicate author
  await supabaseAdmin.from('authors').delete().eq('id', remove_id)

  return Response.json({ ok: true })
}
