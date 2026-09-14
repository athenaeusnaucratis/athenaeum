import { addBookClass, removeBookClass, setPrimaryClass } from '@/lib/books'

export async function POST(request, { params }) {
  const { id } = await params
  const { class_id, is_primary = false } = await request.json()
  const { error } = await addBookClass(id, class_id, !!is_primary)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const { class_id } = await request.json()
  const { error } = await removeBookClass(id, class_id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

export async function PATCH(request, { params }) {
  const { id } = await params
  const { class_id } = await request.json()
  const { error } = await setPrimaryClass(id, class_id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
