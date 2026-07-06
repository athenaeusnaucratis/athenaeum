import { supabaseAdmin } from '@/lib/supabase'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(request, { params }) {
  const { id } = await params
  const formData = await request.formData()
  const file = formData.get('file')

  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })

  let publicUrl

  try {
    const result = await uploadToCloudinary(file, {
      folder: `athenaeum/${id}`,
      publicId: 'cover',
    })
    publicUrl = result.url
  } catch (cloudErr) {
    // Fallback to Supabase storage
    console.warn('Cloudinary failed, falling back to Supabase:', cloudErr.message)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${id}.${ext}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('covers')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 })

    const { data } = supabaseAdmin.storage.from('covers').getPublicUrl(path)
    publicUrl = data.publicUrl
  }

  const { error: updateError } = await supabaseAdmin
    .from('books')
    .update({ cover_image_url: publicUrl })
    .eq('id', id)

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 })

  return Response.json({ cover_image_url: publicUrl })
}
