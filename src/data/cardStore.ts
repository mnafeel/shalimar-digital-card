import { firestoreGet, firestoreSet } from '../lib/firebase'

export interface ExperienceMoment {
  id: string
  title: string
  subtitle: string
  image: string
}

export interface CardData {
  brandName: string
  tagline: string
  ownerName: string
  designation: string
  phone: string
  whatsapp: string
  email: string
  website: string
  address: string
  mapEmbedUrl: string
  mapLink: string
  facebook: string
  instagram: string
  youtube: string
  about: string
  logoUrl: string
  logoIconUrl: string
  logoVariants: string[]
  shopFrontUrl: string
  shopPinUrl: string
  wallpaperUrl: string
  accentNote: string
  experience: ExperienceMoment[]
}

export const DEFAULT_CARD: CardData = {
  brandName: 'Shalimar Fashions',
  tagline: 'Timeless elegance · Modern craft',
  ownerName: 'Shalimar Fashions',
  designation: 'Premium Fashion House',
  phone: '+91 70256 48555',
  whatsapp: '917025648555',
  email: 'hello@shalimarfashions.com',
  website: 'https://shalimarfashions.com',
  address: 'Market Road, Ernakulam, Kochi, Kerala',
  mapEmbedUrl:
    'https://maps.google.com/maps?q=Shalimar+Fashions,+Market+Road,+Ernakulam&hl=en&t=k&z=18&ie=UTF8&output=embed',
  mapLink:
    'https://maps.google.com/maps?q=Shalimar+Fashions,+Market+Road,+Ernakulam&hl=en&t=k&z=18',
  facebook: 'https://facebook.com/shalimarfashions',
  instagram: 'https://instagram.com/shalimarfashions',
  youtube: '',
  about:
    'Shalimar Fashions on Market Road, Ernakulam — curated fashion, personal service, and a boutique experience built for those who dress with intention.',
  logoUrl: '/brand/logo-hero-brown.png',
  logoIconUrl: '/brand/logo-mark.png',
  logoVariants: ['/brand/logo-hero-brown.png', '/brand/logo-hero-gold.png'],
  shopFrontUrl: '/shop/front.jpg',
  shopPinUrl: '/shop/pin.jpg',
  wallpaperUrl: '/shop/wallpaper.jpg',
  accentNote: 'Market Road · Ernakulam',
  experience: [],
}

const STORAGE_KEY = 'sf-digital-card-data-v8'
const AUTH_KEY = 'sf-digital-card-auth'
const ADMIN_PASSWORD = 'shalimar2024'

function mergeCard(parsed: Partial<CardData> | null | undefined): CardData {
  if (!parsed) return structuredClone(DEFAULT_CARD)
  return {
    ...DEFAULT_CARD,
    ...parsed,
    brandName: parsed.brandName || DEFAULT_CARD.brandName,
    ownerName: parsed.ownerName || DEFAULT_CARD.ownerName,
    logoVariants: parsed.logoVariants?.length
      ? parsed.logoVariants
      : [...DEFAULT_CARD.logoVariants],
    experience: parsed.experience?.length
      ? parsed.experience
      : structuredClone(DEFAULT_CARD.experience),
  }
}

export function loadCardData(): CardData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(DEFAULT_CARD)
    return mergeCard(JSON.parse(raw) as Partial<CardData>)
  } catch {
    return structuredClone(DEFAULT_CARD)
  }
}

export function saveCardData(data: CardData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  void persistCardDataCloud(data)
}

export function resetCardData(): CardData {
  localStorage.removeItem(STORAGE_KEY)
  const fresh = structuredClone(DEFAULT_CARD)
  void persistCardDataCloud(fresh)
  return fresh
}

/** Load shared card from Firestore so every browser shows the same brand details. */
export async function fetchCardDataCloud(): Promise<CardData> {
  try {
    const remote = await firestoreGet('config/card')
    if (remote) {
      const merged = mergeCard(remote as Partial<CardData>)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      return merged
    }
    await firestoreSet('config/card', { ...DEFAULT_CARD } as unknown as Record<string, unknown>)
    return structuredClone(DEFAULT_CARD)
  } catch (err) {
    console.warn('Cloud card load failed; using local/defaults', err)
    return loadCardData()
  }
}

async function persistCardDataCloud(data: CardData): Promise<void> {
  try {
    await firestoreSet('config/card', { ...data } as unknown as Record<string, unknown>)
  } catch (err) {
    console.warn('Cloud card save failed', err)
  }
}

export function verifyAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD
}

export function setAdminSession(active: boolean): void {
  if (active) sessionStorage.setItem(AUTH_KEY, '1')
  else sessionStorage.removeItem(AUTH_KEY)
}

export function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem(AUTH_KEY) === '1'
}

export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function telHref(phone: string): string {
  return `tel:${digitsOnly(phone)}`
}

export function whatsappHref(whatsapp: string, message?: string): string {
  const num = digitsOnly(whatsapp)
  const text = encodeURIComponent(message ?? 'Hello! I found your digital card.')
  return `https://wa.me/${num}?text=${text}`
}

export function mailHref(email: string, subject?: string): string {
  const s = encodeURIComponent(subject ?? 'Enquiry — Shalimar Fashions')
  return `mailto:${email}?subject=${s}`
}

export function instagramHandle(url: string): string {
  return url
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/\/$/, '')
}

function contactDisplayPhone(data: CardData): string {
  const rawPhone = digitsOnly(data.phone)
  if (!rawPhone) return ''
  if (rawPhone.startsWith('91') && rawPhone.length >= 12) return `+${rawPhone}`
  if (rawPhone.length === 10) return `+91${rawPhone}`
  return rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`
}

export function buildVCard(data: CardData): string {
  const phone = contactDisplayPhone(data)
  const displayName = (data.ownerName || data.brandName || 'Shalimar Fashions').trim()
  const org = (data.brandName || 'Shalimar Fashions').trim()
  const esc = (value: string) =>
    value
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')

  const nameParts = displayName.split(/\s+/)
  const given = nameParts[0] || displayName
  const family = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'PRODID:-//Shalimar Fashions//Digital Visiting Card//EN',
    `N:${esc(family)};${esc(given)};;;`,
    `FN:${esc(displayName)}`,
    `ORG:${esc(org)}`,
    data.designation ? `TITLE:${esc(data.designation)}` : '',
    phone ? `TEL;TYPE=CELL,VOICE:${phone}` : '',
    data.email ? `EMAIL;TYPE=INTERNET:${esc(data.email)}` : '',
    data.website ? `URL:${esc(data.website)}` : '',
    data.address ? `ADR;TYPE=WORK:;;${esc(data.address)};;;;` : '',
    data.instagram ? `item1.URL:${esc(data.instagram)}` : '',
    data.instagram ? 'item1.X-ABLabel:Instagram' : '',
    data.facebook ? `item2.URL:${esc(data.facebook)}` : '',
    data.facebook ? 'item2.X-ABLabel:Facebook' : '',
    data.mapLink ? `item3.URL:${esc(data.mapLink)}` : '',
    data.mapLink ? 'item3.X-ABLabel:Map' : '',
    data.tagline ? `NOTE:${esc(data.tagline)}` : '',
    'END:VCARD',
  ]

  return `${lines.filter(Boolean).join('\r\n')}\r\n`
}

function isAppleTouchDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isAndroidDevice(): boolean {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
}

function triggerVcfDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function clickHref(href: string): void {
  const a = document.createElement('a')
  a.href = href
  a.rel = 'noopener'
  a.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** Register (or reuse) the worker that serves /contact.vcf with the right MIME type. */
export async function ensureContactServiceWorker(): Promise<ServiceWorker | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw-contact.js', { scope: '/' })
    await navigator.serviceWorker.ready
    return reg.active ?? navigator.serviceWorker.controller
  } catch {
    return null
  }
}

function stashVcardInWorker(worker: ServiceWorker, vcard: string): Promise<void> {
  return new Promise((resolve) => {
    const channel = new MessageChannel()
    const done = () => resolve()
    channel.port1.onmessage = done
    window.setTimeout(done, 250)
    worker.postMessage({ type: 'SET_VCARD', vcard }, [channel.port2])
  })
}

/** Keep /contact.vcf warm so iPhone can open the Save Contact sheet. */
export async function prepareContactVcf(data: CardData): Promise<void> {
  try {
    const worker = await ensureContactServiceWorker()
    if (worker) await stashVcardInWorker(worker, buildVCard(data))
  } catch {
    /* ignore */
  }
}

export function isAndroidPhone(): boolean {
  return isAndroidDevice()
}

export function isApplePhone(): boolean {
  return isAppleTouchDevice()
}

/** Same-origin .vcf URL — iPhone opens Save Contact from this. */
export function contactVcfHref(origin = typeof window !== 'undefined' ? window.location.origin : ''): string {
  const base = (origin || 'https://digitalcard.shalimarfashions.com').replace(/\/$/, '')
  return `${base}/contact.vcf`
}

function buildAndroidInsertContactIntent(data: CardData): string {
  const name = (data.ownerName || data.brandName || 'Shalimar Fashions').trim()
  const phone = contactDisplayPhone(data)
  const email = (data.email || '').trim()
  const company = (data.brandName || '').trim()
  const jobTitle = (data.designation || '').trim()
  const postal = (data.address || '').trim()

  const extras = [
    `S.name=${encodeURIComponent(name)}`,
    phone ? `S.phone=${encodeURIComponent(phone)}` : '',
    email ? `S.email=${encodeURIComponent(email)}` : '',
    company ? `S.company=${encodeURIComponent(company)}` : '',
    jobTitle ? `S.job_title=${encodeURIComponent(jobTitle)}` : '',
    postal ? `S.postal=${encodeURIComponent(postal)}` : '',
  ].filter(Boolean)

  return (
    `intent://vnd.android.cursor.dir/raw_contact/#Intent;` +
    `action=android.intent.action.INSERT;` +
    `type=vnd.android.cursor.dir/raw_contact;` +
    `${extras.join(';')};end`
  )
}

/** Hand hosted .vcf to Contacts app (open). Falls back to Add Contact form. */
export function buildAndroidOpenVcfIntent(
  data: CardData,
  origin = typeof window !== 'undefined' ? window.location.origin : '',
): string {
  if (typeof navigator !== 'undefined' && /Firefox/i.test(navigator.userAgent)) {
    return buildAndroidInsertContactIntent(data)
  }

  const base = (origin || 'https://digitalcard.shalimarfashions.com').replace(/\/$/, '')
  const vcf = new URL('/shalimar-fashions.vcf', `${base}/`)
  const scheme = vcf.protocol.replace(':', '') || 'https'
  const insertFallback = encodeURIComponent(buildAndroidInsertContactIntent(data))

  return (
    `intent://${vcf.host}${vcf.pathname}#Intent;` +
    `scheme=${scheme};` +
    `action=android.intent.action.VIEW;` +
    `type=text/x-vcard;` +
    `S.browser_fallback_url=${insertFallback};` +
    `end`
  )
}

/**
 * Android “save & open”:
 * 1) Save the .vcf (Chrome shows a bar with Open)
 * 2) Try to open it in Contacts immediately
 * Opening the saved file is what shows name + Save / Google account — same as opening a VCF.
 */
export function saveAndOpenVCardAndroid(data: CardData): 'opened' {
  const vcard = buildVCard(data)
  const filename = `${(data.brandName || 'Shalimar-Fashions').replace(/\s+/g, '-')}.vcf`
  const blob = new Blob([vcard], { type: 'text/x-vcard;charset=utf-8' })

  // 1) Save — Android Chrome snackbar includes “Open” → Contacts import sheet
  triggerVcfDownload(blob, filename)

  // 2) Open — hand file to Contacts when the browser allows it
  clickHref(buildAndroidOpenVcfIntent(data, window.location.origin))

  return 'opened'
}

/**
 * Open the system Save Contact UI.
 * iPhone: navigate to .vcf (Safari Save Contact sheet).
 * Android: save & open (.vcf download + open in Contacts).
 * Desktop: save dialog / Downloads folder.
 */
export async function downloadVCard(
  data: CardData,
): Promise<'opened' | 'shared' | 'downloaded' | 'cancelled'> {
  const filename = `${(data.brandName || 'shalimar-fashions')
    .replace(/\s+/g, '-')
    .toLowerCase()}.vcf`

  if (isAndroidDevice()) {
    saveAndOpenVCardAndroid(data)
    return 'opened'
  }

  if (isAppleTouchDevice()) {
    await prepareContactVcf(data)
    window.location.assign(contactVcfHref())
    return 'opened'
  }

  const blob = new Blob([buildVCard(data)], { type: 'text/vcard;charset=utf-8' })
  triggerVcfDownload(blob, filename)
  return 'downloaded'
}
