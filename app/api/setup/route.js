import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  const results = []

  // Create covers bucket if it doesn't exist
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  const exists = buckets?.some(b => b.name === 'covers')

  if (!exists) {
    const { error } = await supabaseAdmin.storage.createBucket('covers', {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    })
    if (error) results.push({ covers_bucket: error.message })
    else results.push({ covers_bucket: 'created' })
  } else {
    results.push({ covers_bucket: 'exists' })
  }

  // Create book_images table
  const { error: tableErr } = await supabaseAdmin.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS book_images (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        image_url text NOT NULL,
        storage_path text,
        sort_order int DEFAULT 0,
        is_cover boolean DEFAULT false,
        created_at timestamptz DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_book_images_book_id ON book_images(book_id);
    `
  })

  if (tableErr) {
    // Try raw SQL approach if rpc doesn't exist
    const { error: rawErr } = await supabaseAdmin.from('book_images').select('id').limit(1)
    if (rawErr && rawErr.code === '42P01') {
      // Table doesn't exist — need to create via dashboard or migration
      results.push({ book_images: 'table needs manual creation — see instructions' })
    } else if (rawErr) {
      results.push({ book_images: rawErr.message })
    } else {
      results.push({ book_images: 'exists' })
    }
  } else {
    results.push({ book_images: 'created' })
  }

  return Response.json({ ok: true, results })
}
