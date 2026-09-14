import { addBookCuisine, removeBookCuisine } from '@/lib/books'

export async function POST(request, { params }) {
  const { id } = await params
  const { cuisine_id } = await request.json()
  const { error } = await addBookCuisine(id, cuisine_id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const { cuisine_id } = await request.json()
  const { error } = await removeBookCuisine(id, cuisine_id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
