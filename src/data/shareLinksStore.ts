export interface ShareLink {
  id: string
  label: string
  slug: string
  createdAt: string
  published: boolean
  opens: number
  createdBy: string
}

const LINKS_KEY = 'sf-share-links-v1'
const USERS_KEY = 'sf-admin-users-v1'
export const CARD_PUBLIC_URL = 'https://digitalcard.shalimarfashions.com'

export interface RegisteredUser {
  id: string
  name: string
  createdAt: string
}

function readLinks(): ShareLink[] {
  try {
    const raw = localStorage.getItem(LINKS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ShareLink[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLinks(links: ShareLink[]) {
  localStorage.setItem(LINKS_KEY, JSON.stringify(links))
}

export function loadShareLinks(): ShareLink[] {
  return readLinks().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export function buildShareUrl(slug: string): string {
  const base = CARD_PUBLIC_URL.replace(/\/$/, '')
  return `${base}/?s=${encodeURIComponent(slug)}`
}

export function createShareLink(label: string, createdBy: string): ShareLink {
  const baseSlug = slugify(label) || `link-${Date.now().toString(36)}`
  const existing = readLinks()
  let slug = baseSlug
  let n = 2
  while (existing.some((l) => l.slug === slug)) {
    slug = `${baseSlug}-${n++}`
  }
  const link: ShareLink = {
    id: `lnk-${Date.now()}`,
    label: label.trim() || 'Untitled link',
    slug,
    createdAt: new Date().toISOString(),
    published: true,
    opens: 0,
    createdBy: createdBy.trim() || 'Admin',
  }
  writeLinks([link, ...existing])
  return link
}

export function setShareLinkPublished(id: string, published: boolean): ShareLink[] {
  const next = readLinks().map((l) => (l.id === id ? { ...l, published } : l))
  writeLinks(next)
  return next
}

export function removeShareLink(id: string): ShareLink[] {
  const next = readLinks().filter((l) => l.id !== id)
  writeLinks(next)
  return next
}

export function recordShareLinkOpen(slug: string): void {
  if (!slug) return
  const next = readLinks().map((l) =>
    l.slug === slug && l.published ? { ...l, opens: (l.opens || 0) + 1 } : l,
  )
  writeLinks(next)
}

export function whatsappShareHref(shareUrl: string, brandName: string): string {
  const text = encodeURIComponent(
    `${brandName || 'Shalimar Fashions'}\n\nOpen our card\nFind our shop\n${shareUrl}`,
  )
  return `https://wa.me/?text=${text}`
}

export function loadRegisteredUsers(): RegisteredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) {
      const seed: RegisteredUser[] = [
        { id: 'user-admin', name: 'Admin', createdAt: new Date().toISOString() },
      ]
      localStorage.setItem(USERS_KEY, JSON.stringify(seed))
      return seed
    }
    const parsed = JSON.parse(raw) as RegisteredUser[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return [{ id: 'user-admin', name: 'Admin', createdAt: new Date().toISOString() }]
  }
}

export function addRegisteredUser(name: string): RegisteredUser[] {
  const users = loadRegisteredUsers()
  const trimmed = name.trim()
  if (!trimmed) return users
  if (users.some((u) => u.name.toLowerCase() === trimmed.toLowerCase())) return users
  const next = [
    ...users,
    { id: `user-${Date.now()}`, name: trimmed, createdAt: new Date().toISOString() },
  ]
  localStorage.setItem(USERS_KEY, JSON.stringify(next))
  return next
}

export function removeRegisteredUser(id: string): RegisteredUser[] {
  const next = loadRegisteredUsers().filter((u) => u.id !== id)
  if (!next.length) {
    const seed = [{ id: 'user-admin', name: 'Admin', createdAt: new Date().toISOString() }]
    localStorage.setItem(USERS_KEY, JSON.stringify(seed))
    return seed
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(next))
  return next
}
