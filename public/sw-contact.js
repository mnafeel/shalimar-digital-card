/* Serve contact.vcf as text/vcard so Android/iPhone open the Save Contact sheet
   (same UI as opening a downloaded .vcf — name + Save, account picker on Samsung). */
const CACHE = 'sf-contact-vcard-v3'
const VCARD_PATH = '/contact.vcf'

function vcardResponse(body: string): Response {
  return new Response(body, {
    headers: {
      // text/vcard is what Android Chrome uses to open Contacts import (not a plain download)
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': 'inline; filename="Shalimar-Fashions.vcf"',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(Promise.resolve())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || data.type !== 'SET_VCARD' || typeof data.vcard !== 'string') return

  const reply = event.ports?.[0]

  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.put(VCARD_PATH, vcardResponse(data.vcard)))
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
  // Only /contact.vcf — do not intercept /shalimar-fashions.vcf (used as network fallback)
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
          return vcardResponse(body)
        }
      } catch {
        /* ignore */
      }

      return new Response('Contact unavailable', { status: 404, statusText: 'Not Found' })
    })(),
  )
})
