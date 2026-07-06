import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(request, { params }) {
  const { id } = await params
  await supabaseAdmin.from('book_chefs').delete().eq('chef_id', id)
  const { error } = await supabaseAdmin.from('chefs').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

export async function PATCH(request, { params }) {
  const { id } = await params
  const fields = await request.json()
  const update = {
    full_name: fields.full_name ?? undefined,
    sort_name: fields.sort_name ?? undefined,
    bio: fields.bio !== undefined ? (fields.bio || null) : undefined,
    photo_url: fields.photo_url !== undefined ? (fields.photo_url || null) : undefined,
    nationality: fields.nationality !== undefined ? (fields.nationality || null) : undefined,
    birth_year: fields.birth_year !== undefined ? (fields.birth_year ? parseInt(fields.birth_year) : null) : undefined,
    death_year: fields.death_year !== undefined ? (fields.death_year ? parseInt(fields.death_year) : null) : undefined,
    restaurants: fields.restaurants !== undefined ? (fields.restaurants || null) : undefined,
    specialties: fields.specialties !== undefined ? (fields.specialties || null) : undefined,
    notes: fields.notes !== undefined ? (fields.notes || null) : undefined,
  }
  Object.keys(update).forEach(k => update[k] === undefined && delete update[k])
  const { error } = await supabaseAdmin.from('chefs').update(update).eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
