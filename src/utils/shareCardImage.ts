import QRCode from 'qrcode'
import type { CardData } from '../data/cardStore'

/** Landscape visiting-card share art (canvas — not HTML/CSS) */
const CARD_W = 1920
const CARD_H = 1080
const SHARE_URL = 'https://digitalcard.shalimarfashions.com'

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

function containDraw(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  maxW: number,
  maxH: number,
) {
  const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight)
  const dw = img.naturalWidth * scale
  const dh = img.naturalHeight * scale
  ctx.drawImage(img, x + (maxW - dw) / 2, y + (maxH - dh) / 2, dw, dh)
}

function roundRectPath(
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

async function makeQrImage(url: string, size: number): Promise<HTMLImageElement> {
  const dataUrl = await QRCode.toDataURL(url, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#1c1816',
      light: '#fffcf8',
    },
  })
  return loadImage(dataUrl)
}

function hostLabel(url: string): string {
  return url
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '')
}

/** Landscape visiting-card share image — matches on-card white logo look */
export async function renderDigitalCardImage(
  data: CardData,
  cardUrl: string = SHARE_URL,
): Promise<Blob> {
  const W = CARD_W
  const H = CARD_H
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  const targetUrl = (cardUrl || SHARE_URL).replace(/\/$/, '') || SHARE_URL
  const qrLink = targetUrl.includes('digitalcard') ? targetUrl : SHARE_URL

  await Promise.race([
    document.fonts.ready.catch(() => undefined),
    new Promise((r) => window.setTimeout(r, 600)),
  ])

  const footerH = 90
  const photoH = H - footerH
  // Give the shop image more width; QR panel stays readable on the right
  const photoW = Math.round(W * 0.58)
  const sideW = W - photoW
  // Slightly larger QR, still balanced
  const qrSize = 500
  const qrPad = 16

  const [shop, logo, qr] = await Promise.all([
    loadImage(data.shopFrontUrl || data.wallpaperUrl || '/shop/front.jpg').catch(() => null),
    loadImage('/brand/logo-hero-white.png').catch(() =>
      loadImage('/brand/logo-white.png').catch(() => null),
    ),
    makeQrImage(qrLink, qrSize * 2),
  ])

  // Base cream
  ctx.fillStyle = '#fffcf8'
  ctx.fillRect(0, 0, W, H)

  // —— Photo stage (left — expanded) ——
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, photoW, photoH)
  ctx.clip()
  if (shop) {
    coverDraw(ctx, shop, 0, 0, photoW, photoH)
  } else {
    ctx.fillStyle = '#1c1816'
    ctx.fillRect(0, 0, photoW, photoH)
  }

  const veil = ctx.createLinearGradient(0, 0, 0, photoH)
  veil.addColorStop(0, 'rgba(28, 24, 20, 0.12)')
  veil.addColorStop(0.45, 'rgba(28, 24, 20, 0.28)')
  veil.addColorStop(1, 'rgba(28, 24, 20, 0.55)')
  ctx.fillStyle = veil
  ctx.fillRect(0, 0, photoW, photoH)

  const glow = ctx.createRadialGradient(
    photoW / 2,
    photoH * 0.46,
    20,
    photoW / 2,
    photoH * 0.46,
    Math.min(photoW, photoH) * 0.42,
  )
  glow.addColorStop(0, 'rgba(255, 236, 210, 0.3)')
  glow.addColorStop(1, 'rgba(255, 236, 210, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, photoW, photoH)

  if (logo) {
    const logoMaxW = Math.min(photoW * 0.58, 480)
    const logoMaxH = Math.min(photoH * 0.46, 310)
    const logoY = (photoH - logoMaxH) / 2 - 6
    containDraw(ctx, logo, (photoW - logoMaxW) / 2, logoY, logoMaxW, logoMaxH)
  }
  ctx.restore()

  // —— Side panel: QR + scan copy + address ——
  const sideX = photoW
  const sideGrad = ctx.createLinearGradient(sideX, 0, W, photoH)
  sideGrad.addColorStop(0, '#f7f1ea')
  sideGrad.addColorStop(1, '#efe6dc')
  ctx.fillStyle = sideGrad
  ctx.fillRect(sideX, 0, sideW, photoH)

  ctx.fillStyle = 'rgba(155, 129, 104, 0.18)'
  ctx.fillRect(sideX, 0, 2, photoH)

  const qrBox = qrSize + qrPad * 2
  const qrBoxX = sideX + (sideW - qrBox) / 2
  // Vertically center the QR + scan text block in the light panel
  // (address stays anchored near the bottom)
  const scanBlockH = 96
  const addrReserve = 100
  const availableH = photoH - addrReserve
  const qrBoxY = Math.max(24, (availableH - qrBox - scanBlockH) / 2 + 8)

  ctx.save()
  ctx.shadowColor = 'rgba(70, 55, 50, 0.14)'
  ctx.shadowBlur = 20
  ctx.shadowOffsetY = 8
  roundRectPath(ctx, qrBoxX, qrBoxY, qrBox, qrBox, 18)
  ctx.fillStyle = '#fffcf8'
  ctx.fill()
  ctx.restore()

  roundRectPath(ctx, qrBoxX, qrBoxY, qrBox, qrBox, 18)
  ctx.strokeStyle = 'rgba(155, 129, 104, 0.34)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.drawImage(qr, qrBoxX + qrPad, qrBoxY + qrPad, qrSize, qrSize)

  const centerX = sideX + sideW / 2
  let ty = qrBoxY + qrBox + 32

  ctx.textAlign = 'center'
  const letter = ctx as CanvasRenderingContext2D & { letterSpacing?: string }

  ctx.fillStyle = '#9b8168'
  ctx.font = '600 11px Montserrat, Figtree, system-ui, sans-serif'
  letter.letterSpacing = '0.32em'
  ctx.fillText('SCAN ME', centerX, ty)
  letter.letterSpacing = '0'

  // Cleaner two-line prompt: light weight + brand emphasis
  ty += 30
  ctx.fillStyle = 'rgba(42, 39, 36, 0.62)'
  ctx.font = '500 17px Montserrat, Figtree, system-ui, sans-serif'
  letter.letterSpacing = '0.04em'
  ctx.fillText('Scan our', centerX, ty)
  letter.letterSpacing = '0'

  ty += 28
  ctx.fillStyle = '#2a2724'
  ctx.font = '700 23px Montserrat, Figtree, system-ui, sans-serif'
  letter.letterSpacing = '0.06em'
  ctx.fillText('Shalimar Digital Card', centerX, ty)
  letter.letterSpacing = '0'

  // Address at bottom of light panel
  const addrBaseY = photoH - 34

  ctx.strokeStyle = 'rgba(155, 129, 104, 0.32)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(centerX - 56, addrBaseY - 44)
  ctx.lineTo(centerX + 56, addrBaseY - 44)
  ctx.stroke()

  ctx.fillStyle = '#2a2724'
  ctx.font = '700 19px Montserrat, Figtree, system-ui, sans-serif'
  letter.letterSpacing = '0.14em'
  ctx.fillText('MARKET ROAD', centerX, addrBaseY - 20)
  letter.letterSpacing = '0'

  ctx.fillStyle = 'rgba(42, 39, 36, 0.52)'
  ctx.font = '500 13px Montserrat, Figtree, system-ui, sans-serif'
  letter.letterSpacing = '0.1em'
  ctx.fillText('Ernakulam  ·  Kochi', centerX, addrBaseY)
  letter.letterSpacing = '0'

  // —— Dark footer: brand · phone · links ——
  ctx.fillStyle = '#2a2420'
  ctx.fillRect(0, photoH, W, footerH)

  const goldLine = ctx.createLinearGradient(0, photoH, W, photoH)
  goldLine.addColorStop(0, 'rgba(201, 179, 154, 0)')
  goldLine.addColorStop(0.5, 'rgba(201, 179, 154, 0.55)')
  goldLine.addColorStop(1, 'rgba(201, 179, 154, 0)')
  ctx.fillStyle = goldLine
  ctx.fillRect(0, photoH, W, 1)

  const phone = data.phone || '+91 70256 48555'
  const links = [
    'Shalimar Fashions',
    phone,
    hostLabel(SHARE_URL),
    data.website ? hostLabel(data.website) : '',
  ].filter(Boolean)

  ctx.fillStyle = 'rgba(255, 252, 248, 0.88)'
  ctx.font = '500 17px Montserrat, Figtree, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(links.join('   ·   '), W / 2, photoH + footerH / 2 + 6)

  // Outer frame
  ctx.strokeStyle = 'rgba(155, 129, 104, 0.4)'
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, W - 2, H - 2)

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
  const url = cardUrl?.includes('digitalcard') ? cardUrl : SHARE_URL
  const blob = await renderDigitalCardImage(data, url)
  const filename = 'shalimar-visiting-card.png'
  const file = new File([blob], filename, { type: 'image/png' })
  const brand = data.brandName || 'Shalimar Fashions'
  const text = [
    brand,
    '',
    'Open our card',
    'Find our shop',
    hostLabel(SHARE_URL),
  ].join('\n')

  try {
    if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: brand,
        text,
      })
      return 'shared'
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: brand, text, url: SHARE_URL })
      triggerDownload(blob, filename)
      return 'shared'
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
  }

  triggerDownload(blob, filename)
  try {
    await navigator.clipboard.writeText(`${brand}\n\nOpen our card\nFind our shop\n${SHARE_URL}`)
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
