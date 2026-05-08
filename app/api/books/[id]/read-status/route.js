import { updateReadStatus } from '@/lib/books'

export async function PATCH(request, { params }) {
  const { id } = await params
  const { status } = await request.json()
  const valid = ['unread', 'reading', 'read', 'reference']
  if (!valid.includes(status)) return Response.json({ error: 'Invalid status' }, { status: 400 })
  const { error } = await updateReadStatus(id, status)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
