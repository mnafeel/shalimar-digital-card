import type { CardData } from '../data/cardStore'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    const timer = window.setTimeout(() => reject(new Error(`Timeout ${src}`)), 4000)
    img.onload = () => {
      window.clearTimeout(timer)
      resolve(img)
    }
    img.onerror = () => {
      window.clearTimeout(timer)
      reject(new Error(`Failed to load ${src}`))
    }
    img.src = src
  })
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function coverDraw(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const ir = img.naturalWidth / img.naturalHeight
  const tr = w / h
  let dw = w
  let dh = h
  let dx = x
  let dy = y
  if (ir > tr) {
    dw = h * ir
    dx = x - (dw - w) / 2
  } else {
    dh = w / ir
    dy = y - (dh - h) / 2
  }
  ctx.drawImage(img, dx, dy, dw, dh)
}

/** Large portrait digital visiting card for WhatsApp / share sheets */
export async function renderDigitalCardImage(
  data: CardData,
  cardUrl: string,
): Promise<Blob> {
  const W = 1080
  const H = 1620
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  await Promise.race([
    document.fonts.ready.catch(() => undefined),
    new Promise((r) => window.setTimeout(r, 800)),
  ])

  const [shop, logo] = await Promise.all([
    loadImage(data.shopFrontUrl || data.wallpaperUrl || '/shop/front.jpg').catch(() => null),
    loadImage('/brand/logo-hero-white.png').catch(() =>
      loadImage(data.logoUrl || '/brand/logo-hero-brown.png').catch(() => null),
    ),
  ])

  // Atmosphere
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#1a1614')
  bg.addColorStop(0.45, '#2a2420')
  bg.addColorStop(1, '#12100e')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  if (shop) {
    ctx.save()
    ctx.globalAlpha = 0.42
    coverDraw(ctx, shop, 0, 0, W, H * 0.62)
    ctx.restore()
  }

  const veil = ctx.createLinearGradient(0, 0, 0, H * 0.7)
  veil.addColorStop(0, 'rgba(18, 16, 14, 0.25)')
  veil.addColorStop(0.55, 'rgba(18, 16, 14, 0.55)')
  veil.addColorStop(1, 'rgba(18, 16, 14, 0.92)')
  ctx.fillStyle = veil
  ctx.fillRect(0, 0, W, H * 0.7)

  // Soft glow behind logo
  const glow = ctx.createRadialGradient(W / 2, 380, 40, W / 2, 380, 320)
  glow.addColorStop(0, 'rgba(255, 236, 210, 0.28)')
  glow.addColorStop(1, 'rgba(255, 236, 210, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 80, W, 620)

  if (logo) {
    const maxW = 520
    const scale = maxW / logo.naturalWidth
    const lw = maxW
    const lh = logo.naturalHeight * scale
    ctx.drawImage(logo, (W - lw) / 2, 220, lw, lh)
  }

  // Cream content card
  const cardX = 72
  const cardY = 760
  const cardW = W - 144
  const cardH = 720
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 18
  roundRect(ctx, cardX, cardY, cardW, cardH, 36)
  ctx.fillStyle = '#fffcf8'
  ctx.fill()
  ctx.restore()

  roundRect(ctx, cardX, cardY, cardW, cardH, 36)
  ctx.strokeStyle = 'rgba(201, 179, 154, 0.45)'
  ctx.lineWidth = 2
  ctx.stroke()

  let y = cardY + 72

  ctx.fillStyle = '#9b8168'
  ctx.font = '600 28px Figtree, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = '0.18em'
  ctx.fillText((data.accentNote || 'Market Road · Ernakulam').toUpperCase(), W / 2, y)

  y += 70
  ctx.fillStyle = '#2a2724'
  ctx.font = '800 64px Montserrat, Figtree, system-ui, sans-serif'
  ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = '0.16em'
  ctx.fillText('SHALIMAR', W / 2, y)

  y += 48
  ctx.fillStyle = 'rgba(42, 39, 36, 0.55)'
  ctx.font = '500 28px Montserrat, Figtree, system-ui, sans-serif'
  ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = '0.42em'
  ctx.fillText('FASHIONS', W / 2, y)

  y += 48
  ctx.fillStyle = 'rgba(42, 39, 36, 0.58)'
  ctx.font = '400 30px Figtree, system-ui, sans-serif'
  ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = '0'
  const tag = data.tagline || 'Digital Visiting Card'
  ctx.fillText(tag.length > 42 ? `${tag.slice(0, 40)}…` : tag, W / 2, y)

  // Divider
  y += 36
  ctx.strokeStyle = 'rgba(42, 39, 36, 0.1)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(W / 2 - 160, y)
  ctx.lineTo(W / 2 + 160, y)
  ctx.stroke()

  y += 64
  ctx.fillStyle = '#2a2724'
  ctx.font = '700 34px Figtree, system-ui, sans-serif'
  ctx.fillText(data.phone || '', W / 2, y)

  if (data.phoneSecondary) {
    y += 48
    ctx.fillStyle = 'rgba(42, 39, 36, 0.72)'
    ctx.font = '600 32px Figtree, system-ui, sans-serif'
    ctx.fillText(data.phoneSecondary, W / 2, y)
  }

  y += 56
  ctx.fillStyle = 'rgba(42, 39, 36, 0.5)'
  ctx.font = '400 26px Figtree, system-ui, sans-serif'
  const addr = data.address || ''
  const maxChars = 38
  if (addr.length <= maxChars) {
    ctx.fillText(addr, W / 2, y)
  } else {
    const mid = addr.lastIndexOf(' ', maxChars)
    const split = mid > 12 ? mid : maxChars
    ctx.fillText(addr.slice(0, split).trim(), W / 2, y)
    ctx.fillText(addr.slice(split).trim(), W / 2, y + 36)
    y += 36
  }

  y = cardY + cardH - 70
  ctx.fillStyle = '#9b8168'
  ctx.font = '600 24px Figtree, system-ui, sans-serif'
  const host = cardUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
  ctx.fillText(host || 'digitalcard.shalimarfashions.com', W / 2, y)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Image export failed'))),
      'image/png',
      0.95,
    )
  })
}

export async function shareDigitalCard(
  data: CardData,
  cardUrl: string,
): Promise<'shared' | 'downloaded' | 'copied' | 'cancelled'> {
  const blob = await renderDigitalCardImage(data, cardUrl)
  const filename = 'shalimar-digital-card.png'
  const file = new File([blob], filename, { type: 'image/png' })
  const text = `${data.brandName} — Digital Visiting Card\n${cardUrl}`

  try {
    if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `${data.brandName} Digital Card`,
        text,
      })
      return 'shared'
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: data.brandName, text, url: cardUrl })
      // Also offer the image as download so they still get the card art
      triggerDownload(blob, filename)
      return 'shared'
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
  }

  triggerDownload(blob, filename)
  try {
    await navigator.clipboard.writeText(cardUrl)
    return 'downloaded'
  } catch {
    return 'downloaded'
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}
