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

const STORAGE_KEY = 'sf-digital-card-data-v6'
const AUTH_KEY = 'sf-digital-card-auth'
const ADMIN_PASSWORD = 'shalimar2024'

export function loadCardData(): CardData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(DEFAULT_CARD)
    const parsed = JSON.parse(raw) as Partial<CardData>
    return {
      ...DEFAULT_CARD,
      ...parsed,
      logoVariants: parsed.logoVariants?.length
        ? parsed.logoVariants
        : [...DEFAULT_CARD.logoVariants],
      experience: parsed.experience?.length
        ? parsed.experience
        : structuredClone(DEFAULT_CARD.experience),
    }
  } catch {
    return structuredClone(DEFAULT_CARD)
  }
}

export function saveCardData(data: CardData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function resetCardData(): CardData {
  localStorage.removeItem(STORAGE_KEY)
  return structuredClone(DEFAULT_CARD)
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
  const phone = digitsOnly(data.phone)
  const wa = digitsOnly(data.whatsapp)
  const name = (data.ownerName || data.brandName).replace(/,/g, '\\,')
  const org = data.brandName.replace(/,/g, '\\,')
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:;${name};;;`,
    `FN:${name}`,
    `ORG:${org}`,
    `TITLE:${data.designation}`,
    phone ? `TEL;TYPE=CELL,VOICE:${phone}` : '',
    wa && wa !== phone ? `TEL;TYPE=CELL:${wa}` : '',
    data.email ? `EMAIL;TYPE=INTERNET:${data.email}` : '',
    data.website ? `URL:${data.website}` : '',
    data.address ? `ADR;TYPE=WORK:;;${data.address.replace(/,/g, '\\,')};;;;` : '',
    data.instagram ? `URL;TYPE=Instagram:${data.instagram}` : '',
    data.facebook ? `URL;TYPE=Facebook:${data.facebook}` : '',
    data.mapLink ? `URL;TYPE=Map:${data.mapLink}` : '',
    `NOTE:${(data.tagline || '').replace(/,/g, '\\,')}`,
    'END:VCARD',
  ]
  return lines.filter(Boolean).join('\r\n')
}

/** Saves contact on iPhone & Android without leaving a blank page */
export async function downloadVCard(data: CardData): Promise<void> {
  const vcard = buildVCard(data)
  const filename = `${(data.brandName || 'shalimar').replace(/\s+/g, '-').toLowerCase()}.vcf`
  const file = new File([vcard], filename, { type: 'text/vcard' })

  // Prefer native share sheet → Add to Contacts (iOS / Android)
  try {
    if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: data.brandName,
        text: `Save ${data.brandName} contact`,
      })
      return
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return
  }

  // Fallback: download .vcf in-place (never navigate — avoids blank screen)
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
  window.setTimeout(() => URL.revokeObjectURL(url), 2500)
}
