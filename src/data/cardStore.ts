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

export function buildVCard(data: CardData): string {
  const rawPhone = digitsOnly(data.phone)
  let phone = ''
  if (rawPhone) {
    if (rawPhone.startsWith('91') && rawPhone.length >= 12) phone = `+${rawPhone}`
    else if (rawPhone.length === 10) phone = `+91${rawPhone}`
    else phone = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`
  }

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
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}

/** Opens a vCard so iPhone/Android can Add to Contacts immediately. */
function openVcfForContacts(vcard: string, filename: string): void {
  const apple = isAppleTouchDevice()

  if (apple) {
    // data: URI is the most reliable way for Safari to show “Create New Contact”
    const dataUri = `data:text/vcard;charset=utf-8,${encodeURIComponent(vcard)}`
    const a = document.createElement('a')
    a.href = dataUri
    a.rel = 'noopener'
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    a.remove()
    return
  }

  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' })
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

/**
 * Save to Contacts on iPhone & Android.
 * Opens/downloads a .vcf so the phone’s Contacts app can import immediately.
 */
export async function downloadVCard(
  data: CardData,
): Promise<'opened' | 'shared' | 'downloaded' | 'cancelled'> {
  const vcard = buildVCard(data)
  const filename = `${(data.brandName || 'shalimar-fashions')
    .replace(/\s+/g, '-')
    .toLowerCase()}.vcf`
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' })
  const file = new File([vcard], filename, { type: 'text/vcard' })
  const apple = isAppleTouchDevice()
  const android = isAndroidDevice()

  // Mobile: open/download .vcf → system “Add to Contacts”
  if (apple || android) {
    openVcfForContacts(vcard, filename)
    return 'opened'
  }

  // Desktop: share file if available, else download
  try {
    if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: data.brandName })
      return 'shared'
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
  }

  triggerVcfDownload(blob, filename)
  return 'downloaded'
}
