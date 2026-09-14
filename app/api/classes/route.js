import { getAllClasses } from '@/lib/books'

export async function GET() {
  const { data, error } = await getAllClasses()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
