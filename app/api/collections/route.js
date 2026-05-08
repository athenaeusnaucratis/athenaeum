import { getAllCollections, createCollection } from '@/lib/books'

export async function GET() {
  const { data, error } = await getAllCollections()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request) {
  const { name, description } = await request.json()
  if (!name) return Response.json({ error: 'Name required' }, { status: 400 })
  const { data, error } = await createCollection(name, description)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
