import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Routes that anyone can write to (none right now). Add paths here to exempt them.
const PUBLIC_WRITE_PATHS = []

// Cron secret — Vercel cron auto-sets this header when calling our endpoint
const isCronRequest = (req) =>
  req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}` ||
  req.headers.get('user-agent')?.includes('vercel-cron')

export async function middleware(request) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session cookies on every request
  const { data: { user } } = await supabase.auth.getUser()

  // Lock non-GET API routes (writes) to authenticated users only
  const isApiWrite =
    request.nextUrl.pathname.startsWith('/api/') &&
    request.method !== 'GET' &&
    request.method !== 'HEAD' &&
    !PUBLIC_WRITE_PATHS.some(p => request.nextUrl.pathname.startsWith(p))

  if (isApiWrite && !user && !isCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons/).*)'],
}
