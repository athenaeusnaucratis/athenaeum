import { addBookTag, removeBookTag } from '@/lib/books'

export async function POST(request, { params }) {
  const { id } = await params
  const { tag_id } = await request.json()
  const { error } = await addBookTag(id, tag_id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const { tag_id } = await request.json()
  const { error } = await removeBookTag(id, tag_id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
