import { insertBook } from '@/lib/books'

export async function POST(request) {
  const fields = await request.json()
  const { data, error } = await insertBook(fields)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ id: data.id }, { status: 201 })
}
