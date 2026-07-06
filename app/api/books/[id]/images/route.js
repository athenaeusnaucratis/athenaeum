import { supabaseAdmin } from '@/lib/supabase'
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary'

const MAX_IMAGES = 4

export async function GET(request, { params }) {
  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from('book_images')
    .select('*')
    .eq('book_id', id)
    .order('sort_order')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request, { params }) {
  const { id } = await params
  const formData = await request.formData()
  const file = formData.get('file')

  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })

  // Check current image count
  const { data: existing } = await supabaseAdmin
    .from('book_images')
    .select('id')
    .eq('book_id', id)

  if ((existing?.length ?? 0) >= MAX_IMAGES) {
    return Response.json({ error: `Maximum ${MAX_IMAGES} images allowed` }, { status: 400 })
  }

  const sortOrder = existing?.length ?? 0
  const isCover = sortOrder === 0

  let imageUrl, storagePath

  try {
    // Upload to Cloudinary
    const result = await uploadToCloudinary(file, {
      folder: `athenaeum/${id}`,
      publicId: `${sortOrder}_${Date.now()}`,
    })
    imageUrl = result.url
    storagePath = result.publicId // Store Cloudinary public_id for deletion
  } catch (cloudErr) {
    // Fallback to Supabase storage if Cloudinary not configured
    console.warn('Cloudinary upload failed, falling back to Supabase:', cloudErr.message)
    const ext = (file.name?.split('.').pop() ?? 'jpg').toLowerCase()
    const path = `${id}/${sortOrder}_${Date.now()}.${ext}`

    const { error: uploadErr } = await supabaseAdmin.storage
      .from('covers')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadErr) return Response.json({ error: uploadErr.message }, { status: 500 })

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('covers')
      .getPublicUrl(path)

    imageUrl = publicUrl
    storagePath = `supabase:${path}` // Prefix to distinguish storage backend
  }

  // Insert image record
  const { data: img, error: insertErr } = await supabaseAdmin
    .from('book_images')
    .insert({
      book_id: id,
      image_url: imageUrl,
      storage_path: storagePath,
      sort_order: sortOrder,
      is_cover: isCover,
    })
    .select()
    .single()

  if (insertErr) return Response.json({ error: insertErr.message }, { status: 500 })

  // If this is the first image (cover), also update the book's cover_image_url
  if (isCover) {
    await supabaseAdmin
      .from('books')
      .update({ cover_image_url: imageUrl })
      .eq('id', id)
  }

  return Response.json(img, { status: 201 })
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const { image_id } = await request.json()

  if (!image_id) return Response.json({ error: 'image_id required' }, { status: 400 })

  // Get the image record
  const { data: img } = await supabaseAdmin
    .from('book_images')
    .select('*')
    .eq('id', image_id)
    .eq('book_id', id)
    .single()

  if (!img) return Response.json({ error: 'Image not found' }, { status: 404 })

  // Delete from storage
  if (img.storage_path) {
    if (img.storage_path.startsWith('supabase:')) {
      // Legacy Supabase storage
      const path = img.storage_path.replace('supabase:', '')
      await supabaseAdmin.storage.from('covers').remove([path])
    } else {
      // Cloudinary
      await deleteFromCloudinary(img.storage_path)
    }
  }

  // Delete record
  await supabaseAdmin.from('book_images').delete().eq('id', image_id)

  // If this was the cover, promote the next image
  if (img.is_cover) {
    const { data: remaining } = await supabaseAdmin
      .from('book_images')
      .select('*')
      .eq('book_id', id)
      .order('sort_order')
      .limit(1)

    if (remaining?.[0]) {
      await supabaseAdmin
        .from('book_images')
        .update({ is_cover: true })
        .eq('id', remaining[0].id)
      await supabaseAdmin
        .from('books')
        .update({ cover_image_url: remaining[0].image_url })
        .eq('id', id)
    } else {
      await supabaseAdmin
        .from('books')
        .update({ cover_image_url: null })
        .eq('id', id)
    }
  }

  return Response.json({ ok: true })
}
