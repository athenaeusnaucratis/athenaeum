import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(request, { params }) {
  const { id } = await params
  const fields = await request.json()

  const asText = v => v !== undefined ? (v || null) : undefined
  const asInt = v => v !== undefined ? (v ? parseInt(v) : null) : undefined
  const update = {
    name: fields.name?.trim() || undefined,
    country: asText(fields.country),
    city: asText(fields.city),
    website: asText(fields.website),
    founded_year: asInt(fields.founded_year),
    defunct_year: asInt(fields.defunct_year),
    notes: asText(fields.notes),
  }
  Object.keys(update).forEach(k => update[k] === undefined && delete update[k])

  const { error } = await supabaseAdmin.from('publishers').update(update).eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

export async function DELETE(request, { params }) {
  const { id } = await params
  // Refuse if any books still reference this publisher — safer than orphaning.
  const { count } = await supabaseAdmin
    .from('books')
    .select('id', { count: 'exact', head: true })
    .eq('publisher_id', id)
  if ((count || 0) > 0) {
    return Response.json({ error: `Publisher still referenced by ${count} book(s).` }, { status: 409 })
  }
  const { error } = await supabaseAdmin.from('publishers').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
