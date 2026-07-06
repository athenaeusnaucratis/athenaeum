import { deleteAuthor, updateAuthor } from '@/lib/books'

export async function DELETE(request, { params }) {
  const { id } = await params
  const { error } = await deleteAuthor(id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

export async function PATCH(request, { params }) {
  const { id } = await params
  const fields = await request.json()
  const { error } = await updateAuthor(id, fields)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
