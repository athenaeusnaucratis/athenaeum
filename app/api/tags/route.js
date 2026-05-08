import { createTag, getAllTags } from '@/lib/books'

export async function GET() {
  const { data, error } = await getAllTags()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request) {
  const { name, type } = await request.json()
  if (!name || !type) return Response.json({ error: 'Name and type required' }, { status: 400 })
  const { data, error } = await createTag(name, type)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
