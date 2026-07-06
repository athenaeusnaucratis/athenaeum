import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Minimal query keeps Supabase active and verifies DB connectivity
  const { count, error } = await supabase
    .from('books')
    .select('*', { count: 'exact', head: true })

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 })
  }

  return Response.json({
    ok: true,
    books: count,
    timestamp: new Date().toISOString(),
  })
}
