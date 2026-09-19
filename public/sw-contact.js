/* Serve contact.vcf with text/x-vcard so phones open “Create New Contact”, not a file download. */
const CACHE = 'sf-contact-vcard-v1'
const VCARD_PATH = '/contact.vcf'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(Promise.resolve())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || data.type !== 'SET_VCARD' || typeof data.vcard !== 'string') return

  const reply = event.ports?.[0]

  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.put(
          VCARD_PATH,
          new Response(data.vcard, {
            headers: {
              'Content-Type': 'text/x-vcard; charset=utf-8',
              'Content-Disposition': 'inline; filename="shalimar-fashions.vcf"',
              'Cache-Control': 'no-store',
            },
          }),
        ),
      )
      .then(() => {
        reply?.postMessage({ ok: true })
      })
      .catch(() => {
        reply?.postMessage({ ok: false })
      }),
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (url.pathname !== VCARD_PATH) return

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const cached = await cache.match(VCARD_PATH)
      if (cached) return cached

      try {
        const res = await fetch('/shalimar-fashions.vcf', { cache: 'no-store' })
        if (res.ok) {
          const body = await res.text()
          return new Response(body, {
            headers: {
              'Content-Type': 'text/x-vcard; charset=utf-8',
              'Content-Disposition': 'inline; filename="shalimar-fashions.vcf"',
            },
          })
        }
      } catch {
        /* ignore */
      }

      return new Response('Contact unavailable', { status: 404, statusText: 'Not Found' })
    })(),
  )
})
