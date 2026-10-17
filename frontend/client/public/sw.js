const CACHE_NAME = 'casaway-v3'
const TILE_CACHE = 'casaway-tiles-v1'
const TILE_HOST = 'tile.openstreetmap.org'
const APP_SHELL = [
  '/',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/routes/manifest.json',
  '/routes/casa-port-to-maarif.gpx',
  '/icons/icon.svg',
  '/icons/icon-maskable.svg',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://cdn.jsdelivr.net/npm/leaflet-gpx@1.7.0/gpx.js',
]

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    await Promise.all(APP_SHELL.map(async (asset) => {
      try {
        await cache.add(new Request(asset, { mode: asset.startsWith('http') ? 'no-cors' : 'same-origin' }))
      } catch {
        // A CDN outage should not prevent the local app shell from being installed.
      }
    }))
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(names.filter((name) => name.startsWith('casaway-') && ![CACHE_NAME, TILE_CACHE].includes(name)).map((name) => caches.delete(name)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return

  if (url.hostname.includes(TILE_HOST)) {
    event.respondWith((async () => {
      const cache = await caches.open(TILE_CACHE)
      const cached = await cache.match(request)
      const refresh = fetch(request).then((response) => {
        if (response.ok || response.type === 'opaque') cache.put(request, response.clone())
        return response
      })
      if (cached) {
        event.waitUntil(refresh.catch(() => {}))
        return cached
      }
      try {
        return await refresh
      } catch {
        return new Response('', { status: 503, statusText: 'Tile unavailable offline' })
      }
    })())
    return
  }

  // Navigations are network-first so a fresh deploy is picked up immediately,
  // with the cached shell as the offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME)
      try {
        const response = await fetch(request)
        if (response.ok) cache.put(request, response.clone())
        return response
      } catch {
        return (await cache.match(request)) || (await cache.match('/')) || new Response('', { status: 503, statusText: 'Page unavailable offline' })
      }
    })())
    return
  }

  const isStaticAsset = url.origin === self.location.origin || ['script', 'style', 'image', 'font'].includes(request.destination)
  if (!isStaticAsset) return
  // Stale-while-revalidate: instant response from cache, fresh copy fetched in
  // the background so deploys reach returning users without a SW edit.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(request)
    const refresh = fetch(request).then((response) => {
      if (response.ok || response.type === 'opaque') cache.put(request, response.clone())
      return response
    })
    if (cached) {
      event.waitUntil(refresh.catch(() => {}))
      return cached
    }
    try {
      return await refresh
    } catch {
      return new Response('', { status: 503, statusText: 'Asset unavailable offline' })
    }
  })())
})
