const CACHE_NAME = 'athenaeum-v2'
const PRECACHE = ['/', '/collection', '/add']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  // Never cache API calls — always go to network
  if (url.pathname.startsWith('/api/')) return

  // Only cache same-origin GET requests for navigation/assets
  if (e.request.method !== 'GET') return
  if (url.origin !== self.location.origin) return

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Only cache successful responses for static assets
        if (res.ok && (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.png') || url.pathname.endsWith('.json'))) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request))
  )
})
