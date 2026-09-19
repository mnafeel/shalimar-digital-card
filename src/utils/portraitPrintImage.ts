import QRCode from 'qrcode'
import type { CardData } from '../data/cardStore'

/** Print-ready portrait — A5-ish @ 300dpi-feel (1080×1620) */
const W = 1080
const H = 1620
const SHARE_URL = 'https://digitalcard.shalimarfashions.com'

export type PortraitStyle = 'color' | 'mono'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    const timer = window.setTimeout(() => reject(new Error(`Timeout ${src}`)), 5000)
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

async function makeQr(
  url: string,
  size: number,
  dark: string,
  light: string,
): Promise<HTMLImageElement> {
  const dataUrl = await QRCode.toDataURL(url, {
    width: size,
    margin: 1,
    errorCorrectionLevel: 'H',
    color: { dark, light },
  })
  return loadImage(dataUrl)
}

function hostLabel(url: string): string {
  return url
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '')
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Image export failed'))),
      'image/png',
      1,
    )
  })
}

export function downloadBlob(blob: Blob, filename: string) {
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

/** Premium black & white print card — logo + large scannable QR (not a plain photo) */
async function renderMonoPortrait(data: CardData, cardUrl: string): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  await Promise.race([
    document.fonts.ready.catch(() => undefined),
    new Promise((r) => window.setTimeout(r, 600)),
  ])

  const qrLink = cardUrl.includes('digitalcard') ? cardUrl : SHARE_URL
  const qrSize = 420
  const [logo, qr] = await Promise.all([
    loadImage('/brand/logo-hero-brown.png').catch(() =>
      loadImage('/brand/logo-brown.png').catch(() => null),
    ),
    makeQr(qrLink, qrSize * 2, '#141210', '#f6f3ef'),
  ])

  // Soft ivory paper
  const paper = ctx.createLinearGradient(0, 0, 0, H)
  paper.addColorStop(0, '#f7f4ef')
  paper.addColorStop(0.55, '#f0ebe4')
  paper.addColorStop(1, '#e8e2d9')
  ctx.fillStyle = paper
  ctx.fillRect(0, 0, W, H)

  // Fine border frame
  ctx.strokeStyle = 'rgba(28, 24, 20, 0.55)'
  ctx.lineWidth = 2
  ctx.strokeRect(36, 36, W - 72, H - 72)
  ctx.strokeStyle = 'rgba(28, 24, 20, 0.22)'
  ctx.lineWidth = 1
  ctx.strokeRect(48, 48, W - 96, H - 96)

  // Top brand block
  if (logo) {
    containDraw(ctx, logo, (W - 520) / 2, 110, 520, 220)
  }

  const letter = ctx as CanvasRenderingContext2D & { letterSpacing?: string }
  ctx.textAlign = 'center'

  ctx.fillStyle = 'rgba(28, 24, 20, 0.45)'
  ctx.font = '600 13px Montserrat, Figtree, system-ui, sans-serif'
  letter.letterSpacing = '0.36em'
  ctx.fillText('DIGITAL VISITING CARD', W / 2, 360)
  letter.letterSpacing = '0'

  ctx.fillStyle = '#1c1816'
  ctx.font = '700 42px Montserrat, Figtree, system-ui, sans-serif'
  letter.letterSpacing = '0.12em'
  ctx.fillText((data.brandName || 'SHALIMAR').toUpperCase(), W / 2, 420)
  letter.letterSpacing = '0'

  ctx.fillStyle = 'rgba(28, 24, 20, 0.55)'
  ctx.font = '500 18px Figtree, system-ui, sans-serif'
  ctx.fillText(data.tagline || 'Timeless elegance · Modern craft', W / 2, 458)

  // Hairline
  ctx.strokeStyle = 'rgba(28, 24, 20, 0.28)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(W / 2 - 80, 490)
  ctx.lineTo(W / 2 + 80, 490)
  ctx.stroke()

  // QR plate
  const plate = qrSize + 48
  const plateX = (W - plate) / 2
  const plateY = 540

  ctx.save()
  ctx.shadowColor = 'rgba(20, 16, 12, 0.12)'
  ctx.shadowBlur = 28
  ctx.shadowOffsetY = 10
  roundRectPath(ctx, plateX, plateY, plate, plate, 22)
  ctx.fillStyle = '#f6f3ef'
  ctx.fill()
  ctx.restore()

  roundRectPath(ctx, plateX, plateY, plate, plate, 22)
  ctx.strokeStyle = 'rgba(28, 24, 20, 0.35)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.drawImage(qr, plateX + 24, plateY + 24, qrSize, qrSize)

  let ty = plateY + plate + 48
  ctx.fillStyle = 'rgba(28, 24, 20, 0.5)'
  ctx.font = '600 12px Montserrat, Figtree, system-ui, sans-serif'
  letter.letterSpacing = '0.34em'
  ctx.fillText('SCAN TO OPEN', W / 2, ty)
  letter.letterSpacing = '0'

  ty += 36
  ctx.fillStyle = '#1c1816'
  ctx.font = '600 22px Montserrat, Figtree, system-ui, sans-serif'
  ctx.fillText(hostLabel(SHARE_URL), W / 2, ty)

  ty += 56
  ctx.fillStyle = 'rgba(28, 24, 20, 0.7)'
  ctx.font = '500 20px Figtree, system-ui, sans-serif'
  ctx.fillText(data.phone || '', W / 2, ty)

  ty += 34
  ctx.fillStyle = 'rgba(28, 24, 20, 0.5)'
  ctx.font = '500 16px Figtree, system-ui, sans-serif'
  const addr = (data.address || 'Market Road, Ernakulam').split(',').slice(0, 2).join(',')
  ctx.fillText(addr, W / 2, ty)

  // Footer band
  ctx.fillStyle = '#1c1816'
  ctx.fillRect(0, H - 88, W, 88)
  ctx.fillStyle = 'rgba(246, 243, 239, 0.88)'
  ctx.font = '500 15px Montserrat, Figtree, system-ui, sans-serif'
  letter.letterSpacing = '0.18em'
  ctx.fillText('PRINT · SCAN · CONNECT', W / 2, H - 40)
  letter.letterSpacing = '0'

  return toBlob(canvas)
}

/** Full-color portrait print — shop photo + logo + QR for scanning */
async function renderColorPortrait(data: CardData, cardUrl: string): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  await Promise.race([
    document.fonts.ready.catch(() => undefined),
    new Promise((r) => window.setTimeout(r, 600)),
  ])

  const qrLink = cardUrl.includes('digitalcard') ? cardUrl : SHARE_URL
  const photoH = Math.round(H * 0.58)
  const qrSize = 300

  const [shop, logo, qr] = await Promise.all([
    loadImage(data.shopFrontUrl || data.wallpaperUrl || '/shop/front.jpg').catch(() => null),
    loadImage('/brand/logo-hero-white.png').catch(() =>
      loadImage('/brand/logo-white.png').catch(() => null),
    ),
    makeQr(qrLink, qrSize * 2, '#1c1816', '#fffcf8'),
  ])

  ctx.fillStyle = '#fffcf8'
  ctx.fillRect(0, 0, W, H)

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, W, photoH)
  ctx.clip()
  if (shop) coverDraw(ctx, shop, 0, 0, W, photoH)
  else {
    ctx.fillStyle = '#2a2420'
    ctx.fillRect(0, 0, W, photoH)
  }

  const veil = ctx.createLinearGradient(0, 0, 0, photoH)
  veil.addColorStop(0, 'rgba(28, 24, 20, 0.15)')
  veil.addColorStop(0.55, 'rgba(28, 24, 20, 0.35)')
  veil.addColorStop(1, 'rgba(28, 24, 20, 0.72)')
  ctx.fillStyle = veil
  ctx.fillRect(0, 0, W, photoH)

  if (logo) {
    containDraw(ctx, logo, (W - 460) / 2, photoH * 0.28, 460, 260)
  }
  ctx.restore()

  // Lower cream panel
  const panelY = photoH
  const panelH = H - photoH
  const sideGrad = ctx.createLinearGradient(0, panelY, 0, H)
  sideGrad.addColorStop(0, '#f7f1ea')
  sideGrad.addColorStop(1, '#efe6dc')
  ctx.fillStyle = sideGrad
  ctx.fillRect(0, panelY, W, panelH)

  const plate = qrSize + 36
  const plateX = (W - plate) / 2
  const plateY = panelY + 36

  ctx.save()
  ctx.shadowColor = 'rgba(70, 55, 50, 0.14)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetY = 6
  roundRectPath(ctx, plateX, plateY, plate, plate, 16)
  ctx.fillStyle = '#fffcf8'
  ctx.fill()
  ctx.restore()

  roundRectPath(ctx, plateX, plateY, plate, plate, 16)
  ctx.strokeStyle = 'rgba(155, 129, 104, 0.4)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.drawImage(qr, plateX + 18, plateY + 18, qrSize, qrSize)

  const letter = ctx as CanvasRenderingContext2D & { letterSpacing?: string }
  ctx.textAlign = 'center'
  let ty = plateY + plate + 36

  ctx.fillStyle = '#9b8168'
  ctx.font = '600 11px Montserrat, Figtree, system-ui, sans-serif'
  letter.letterSpacing = '0.32em'
  ctx.fillText('SCAN ME', W / 2, ty)
  letter.letterSpacing = '0'

  ty += 32
  ctx.fillStyle = '#2a2724'
  ctx.font = '700 26px Montserrat, Figtree, system-ui, sans-serif'
  letter.letterSpacing = '0.08em'
  ctx.fillText((data.brandName || 'Shalimar Fashions').toUpperCase(), W / 2, ty)
  letter.letterSpacing = '0'

  ty += 34
  ctx.fillStyle = 'rgba(42, 39, 36, 0.65)'
  ctx.font = '500 17px Figtree, system-ui, sans-serif'
  ctx.fillText(data.phone || '', W / 2, ty)

  ty += 28
  ctx.fillStyle = 'rgba(42, 39, 36, 0.5)'
  ctx.font = '500 14px Figtree, system-ui, sans-serif'
  ctx.fillText(hostLabel(SHARE_URL), W / 2, ty)

  ctx.strokeStyle = 'rgba(155, 129, 104, 0.45)'
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, W - 2, H - 2)

  return toBlob(canvas)
}

export async function renderPortraitPrint(
  data: CardData,
  style: PortraitStyle,
  cardUrl: string = SHARE_URL,
): Promise<Blob> {
  const url = (cardUrl || SHARE_URL).replace(/\/$/, '') || SHARE_URL
  if (style === 'mono') return renderMonoPortrait(data, url)
  return renderColorPortrait(data, url)
}

export async function downloadPortraitPrint(
  data: CardData,
  style: PortraitStyle,
  cardUrl?: string,
): Promise<void> {
  const blob = await renderPortraitPrint(data, style, cardUrl)
  const name =
    style === 'mono'
      ? 'shalimar-print-bw-portrait.png'
      : 'shalimar-print-color-portrait.png'
  downloadBlob(blob, name)
}
