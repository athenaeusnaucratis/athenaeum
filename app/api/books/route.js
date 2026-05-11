import { insertBook } from '@/lib/books'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  const fields = await request.json()

  // Check for duplicate ISBN
  const isbn = fields.isbn_13 || fields.isbn_10
  if (isbn) {
    const { data: existing } = await supabase
      .from('books')
      .select('id, title')
      .or(`isbn_13.eq.${isbn},isbn_10.eq.${isbn}`)
      .maybeSingle()

    if (existing) {
      return Response.json({
        error: `This ISBN already exists: "${existing.title}"`,
        duplicate_id: existing.id,
      }, { status: 409 })
    }
  }

  const { data, error } = await insertBook(fields)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ id: data.id }, { status: 201 })
}
