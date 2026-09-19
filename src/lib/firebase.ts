/** Lightweight Firestore REST client — avoids heavy firebase SDK bundling. */

const PROJECT_ID = 'shalimar-digital-card'
const API_KEY = 'AIzaSyC7-0phXPkhKP-sD8__dNfTnajSx2yFARA'
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

type JsonMap = Record<string, unknown>

function encodeValue(value: unknown): JsonMap {
  if (value === null || value === undefined) return { nullValue: null }
  if (typeof value === 'string') return { stringValue: value }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(encodeValue) } }
  }
  if (typeof value === 'object') {
    const fields: Record<string, JsonMap> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      fields[k] = encodeValue(v)
    }
    return { mapValue: { fields } }
  }
  return { stringValue: String(value) }
}

function decodeValue(node: JsonMap | undefined): unknown {
  if (!node) return undefined
  if ('stringValue' in node) return node.stringValue as string
  if ('booleanValue' in node) return node.booleanValue as boolean
  if ('integerValue' in node) return Number(node.integerValue)
  if ('doubleValue' in node) return node.doubleValue as number
  if ('nullValue' in node) return null
  if ('arrayValue' in node) {
    const values = ((node.arrayValue as JsonMap)?.values as JsonMap[]) || []
    return values.map(decodeValue)
  }
  if ('mapValue' in node) {
    const fields = ((node.mapValue as JsonMap)?.fields as Record<string, JsonMap>) || {}
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(fields)) out[k] = decodeValue(v)
    return out
  }
  if ('timestampValue' in node) return node.timestampValue as string
  return undefined
}

function encodeDocument(data: Record<string, unknown>): { fields: Record<string, JsonMap> } {
  const fields: Record<string, JsonMap> = {}
  for (const [k, v] of Object.entries(data)) fields[k] = encodeValue(v)
  return { fields }
}

function decodeDocument(doc: JsonMap): Record<string, unknown> {
  const fields = (doc.fields as Record<string, JsonMap>) || {}
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(fields)) out[k] = decodeValue(v)
  return out
}

function docIdFromName(name: string): string {
  const parts = name.split('/')
  return parts[parts.length - 1] || name
}

export async function firestoreGet(path: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${BASE}/${path}?key=${API_KEY}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Firestore get failed (${res.status})`)
  const json = (await res.json()) as JsonMap
  return decodeDocument(json)
}

export async function firestoreSet(path: string, data: Record<string, unknown>): Promise<void> {
  const mask = Object.keys(data)
    .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
    .join('&')
  const res = await fetch(`${BASE}/${path}?key=${API_KEY}&${mask}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(encodeDocument(data)),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Firestore set failed (${res.status}): ${text}`)
  }
}

export async function firestoreAdd(
  collectionPath: string,
  data: Record<string, unknown>,
): Promise<string> {
  const res = await fetch(`${BASE}/${collectionPath}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(encodeDocument(data)),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Firestore add failed (${res.status}): ${text}`)
  }
  const json = (await res.json()) as JsonMap
  return docIdFromName(String(json.name || ''))
}

export async function firestoreList(
  collectionPath: string,
  pageSize = 1000,
): Promise<Array<{ id: string; data: Record<string, unknown> }>> {
  const url = `${BASE}/${collectionPath}?key=${API_KEY}&pageSize=${pageSize}&orderBy=at%20desc`
  const res = await fetch(url)
  if (!res.ok) {
    // Fallback without orderBy if index missing
    const fallback = await fetch(`${BASE}/${collectionPath}?key=${API_KEY}&pageSize=${pageSize}`)
    if (!fallback.ok) throw new Error(`Firestore list failed (${fallback.status})`)
    const json = (await fallback.json()) as { documents?: JsonMap[] }
    const docs = (json.documents || []).map((doc) => ({
      id: docIdFromName(String(doc.name || '')),
      data: decodeDocument(doc),
    }))
    docs.sort((a, b) => String(b.data.at || '').localeCompare(String(a.data.at || '')))
    return docs
  }
  const json = (await res.json()) as { documents?: JsonMap[] }
  return (json.documents || []).map((doc) => ({
    id: docIdFromName(String(doc.name || '')),
    data: decodeDocument(doc),
  }))
}
