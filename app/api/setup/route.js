import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  // Create covers bucket if it doesn't exist
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  const exists = buckets?.some(b => b.name === 'covers')

  if (!exists) {
    const { error } = await supabaseAdmin.storage.createBucket('covers', {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    })
    if (error) return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true, message: exists ? 'Bucket already exists' : 'Bucket created' })
}
