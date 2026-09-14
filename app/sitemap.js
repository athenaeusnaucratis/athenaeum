import { supabase } from '@/lib/supabase'

const BASE = 'https://www.athenaeum-deipnon.com'

export default async function sitemap() {
  const now = new Date().toISOString()

  const staticRoutes = [
    { url: BASE, changeFrequency: 'daily', priority: 1.0, lastModified: now },
    { url: `${BASE}/collection`, changeFrequency: 'daily', priority: 0.9, lastModified: now },
    { url: `${BASE}/authors`, changeFrequency: 'weekly', priority: 0.8, lastModified: now },
    { url: `${BASE}/chefs`, changeFrequency: 'weekly', priority: 0.8, lastModified: now },
    { url: `${BASE}/publishers`, changeFrequency: 'weekly', priority: 0.7, lastModified: now },
    { url: `${BASE}/genre`, changeFrequency: 'weekly', priority: 0.7, lastModified: now },
    { url: `${BASE}/language`, changeFrequency: 'weekly', priority: 0.7, lastModified: now },
    { url: `${BASE}/collections`, changeFrequency: 'weekly', priority: 0.7, lastModified: now },
    { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.4, lastModified: now },
  ]

  const dynamicRoutes = []
  try {
    const [{ data: books }, { data: authors }, { data: chefs }, { data: publishers }] = await Promise.all([
      supabase.from('books').select('id, updated_at, created_at').limit(5000),
      supabase.from('authors').select('id').limit(2000),
      supabase.from('chefs').select('id').limit(1000),
      supabase.from('publishers').select('id').limit(2000),
    ])

    for (const b of books || []) {
      dynamicRoutes.push({
        url: `${BASE}/books/${b.id}`,
        lastModified: b.updated_at || b.created_at || now,
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    }
    for (const a of authors || []) {
      dynamicRoutes.push({
        url: `${BASE}/authors/${a.id}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.5,
      })
    }
    for (const c of chefs || []) {
      dynamicRoutes.push({
        url: `${BASE}/chefs/${c.id}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.5,
      })
    }
    for (const p of publishers || []) {
      dynamicRoutes.push({
        url: `${BASE}/publishers/${p.id}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.4,
      })
    }
  } catch {
    // Return static routes only if DB unreachable
  }

  return [...staticRoutes, ...dynamicRoutes]
}
