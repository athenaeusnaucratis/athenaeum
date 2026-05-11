import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request, { params }) {
  const { id } = await params
  const formData = await request.formData()
  const file = formData.get('file')

  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${id}.${ext}`

  // Upload to Supabase Storage (overwrite if exists)
  const { error: uploadError } = await supabaseAdmin.storage
    .from('covers')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 })

  // Get public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('covers')
    .getPublicUrl(path)

  // Update book record
  const { error: updateError } = await supabaseAdmin
    .from('books')
    .update({ cover_image_url: publicUrl })
    .eq('id', id)

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 })

  return Response.json({ cover_image_url: publicUrl })
}
