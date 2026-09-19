import { firestoreAdd, firestoreList } from '../lib/firebase'

export type DeviceKind = 'mobile' | 'tablet' | 'desktop' | 'unknown'

export interface VisitRecord {
  id: string
  at: string
  path: string
  referrer: string
  device: DeviceKind
  browser: string
  os: string
  screen: string
  language: string
  shareSlug: string
}

const SESSION_MARK = 'sf-visit-session'
const LOCAL_CACHE_KEY = 'sf-visit-cache-v2'

function detectDevice(ua: string): DeviceKind {
  const u = ua.toLowerCase()
  if (/ipad|tablet|kindle|silk|(android(?!.*mobile))/.test(u)) return 'tablet'
  if (/mobi|iphone|ipod|android.*mobile|windows phone/.test(u)) return 'mobile'
  if (/macintosh|windows nt|linux|cros/.test(u)) return 'desktop'
  return 'unknown'
}

function detectBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return 'Edge'
  if (/chrome\//i.test(ua) && !/edg\//i.test(ua)) return 'Chrome'
  if (/safari\//i.test(ua) && !/chrome\//i.test(ua)) return 'Safari'
  if (/firefox\//i.test(ua)) return 'Firefox'
  if (/opr\//i.test(ua)) return 'Opera'
  return 'Other'
}

function detectOs(ua: string): string {
  if (/windows nt/i.test(ua)) return 'Windows'
  if (/android/i.test(ua)) return 'Android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS'
  if (/mac os x/i.test(ua)) return 'macOS'
  if (/linux/i.test(ua)) return 'Linux'
  return 'Other'
}

function cacheLocally(visits: VisitRecord[]) {
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(visits.slice(0, 200)))
  } catch {
    /* ignore quota */
  }
}

function readLocalCache(): VisitRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as VisitRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** Record one visit per browser tab session. Persists permanently in Firestore (never deleted). */
export async function trackPageVisit(options?: {
  path?: string
  shareSlug?: string
}): Promise<VisitRecord | null> {
  try {
    if (typeof window === 'undefined') return null
    if (sessionStorage.getItem(SESSION_MARK)) return null
    sessionStorage.setItem(SESSION_MARK, '1')

    const ua = navigator.userAgent || ''
    const params = new URLSearchParams(window.location.search)
    const slug = options?.shareSlug || params.get('s') || ''
    const at = new Date().toISOString()

    const record: Omit<VisitRecord, 'id'> = {
      at,
      path: options?.path || `${window.location.pathname}${window.location.search}`,
      referrer: document.referrer || '',
      device: detectDevice(ua),
      browser: detectBrowser(ua),
      os: detectOs(ua),
      screen: `${window.screen?.width || 0}×${window.screen?.height || 0}`,
      language: navigator.language || '',
      shareSlug: slug,
    }

    const id = await firestoreAdd('visits', { ...record })
    const saved: VisitRecord = { id, ...record }
    cacheLocally([saved, ...readLocalCache()])
    return saved
  } catch (err) {
    console.warn('Visit sync failed', err)
    return null
  }
}

/** Load visits from permanent cloud store. Falls back to local cache if offline. */
export async function loadVisits(): Promise<VisitRecord[]> {
  try {
    const docs = await firestoreList('visits', 1000)
    const visits: VisitRecord[] = docs.map(({ id, data }) => ({
      id,
      at: String(data.at || ''),
      path: String(data.path || ''),
      referrer: String(data.referrer || ''),
      device: (data.device as DeviceKind) || 'unknown',
      browser: String(data.browser || 'Other'),
      os: String(data.os || 'Other'),
      screen: String(data.screen || ''),
      language: String(data.language || ''),
      shareSlug: String(data.shareSlug || ''),
    }))
    cacheLocally(visits)
    return visits
  } catch (err) {
    console.warn('Could not load cloud visits', err)
    return readLocalCache()
  }
}

export interface VisitStats {
  total: number
  today: number
  mobile: number
  desktop: number
  tablet: number
  byDevice: Record<DeviceKind, number>
  byBrowser: Record<string, number>
  byOs: Record<string, number>
}

export function summarizeVisits(visits: VisitRecord[]): VisitStats {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const byDevice: Record<DeviceKind, number> = {
    mobile: 0,
    tablet: 0,
    desktop: 0,
    unknown: 0,
  }
  const byBrowser: Record<string, number> = {}
  const byOs: Record<string, number> = {}

  let today = 0
  for (const v of visits) {
    byDevice[v.device] = (byDevice[v.device] || 0) + 1
    byBrowser[v.browser] = (byBrowser[v.browser] || 0) + 1
    byOs[v.os] = (byOs[v.os] || 0) + 1
    if (v.at && new Date(v.at) >= todayStart) today += 1
  }

  return {
    total: visits.length,
    today,
    mobile: byDevice.mobile,
    desktop: byDevice.desktop,
    tablet: byDevice.tablet,
    byDevice,
    byBrowser,
    byOs,
  }
}

export function formatVisitTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
