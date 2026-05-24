import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  // Create book_images table using raw SQL via supabaseAdmin
  const { error } = await supabaseAdmin.rpc('_create_book_images', {})

  // If RPC doesn't exist, try a different approach — just test if table exists
  if (error) {
    // Check if table already exists
    const { error: testErr } = await supabaseAdmin.from('book_images').select('id').limit(1)

    if (testErr && testErr.code === '42P01') {
      // Table doesn't exist — create via raw query workaround
      // We'll use the pg_catalog approach
      return Response.json({
        error: 'book_images table does not exist. Please run this SQL in Supabase Dashboard > SQL Editor:',
        sql: `CREATE TABLE book_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  storage_path text,
  sort_order int DEFAULT 0,
  is_cover boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_book_images_book_id ON book_images(book_id);`
      }, { status: 200 })
    }

    return Response.json({ ok: true, message: 'book_images table already exists' })
  }

  return Response.json({ ok: true })
}
