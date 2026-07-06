import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  const fields = await request.json()
  const name = (fields.full_name || '').trim()
  if (!name) return Response.json({ error: 'full_name required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('chefs')
    .insert({
      full_name: name,
      sort_name: fields.sort_name || name,
      bio: fields.bio || null,
      photo_url: fields.photo_url || null,
      nationality: fields.nationality || null,
      birth_year: fields.birth_year ? parseInt(fields.birth_year) : null,
      death_year: fields.death_year ? parseInt(fields.death_year) : null,
      restaurants: fields.restaurants || null,
      specialties: fields.specialties || null,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
