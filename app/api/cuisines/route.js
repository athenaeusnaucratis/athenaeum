import { createCuisine, getAllCuisines } from '@/lib/books'

export async function GET() {
  const { data, error } = await getAllCuisines()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request) {
  const { name } = await request.json()
  if (!name?.trim()) return Response.json({ error: 'Name required' }, { status: 400 })
  const { data, error } = await createCuisine(name.trim())
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
