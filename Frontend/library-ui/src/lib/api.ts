import { auth } from './auth'
import { config } from './config'

export type ApiError = {
  status: number
  message: string
  details?: any
}

async function parseMaybeJson(res: Response) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function isUsableToken(token: unknown): token is string {
  if (typeof token !== 'string') return false
  const t = token.trim()
  if (!t) return false
  if (t === 'null' || t === 'undefined') return false
  return true
}

function joinUrl(base: string, path: string) {
  if (!base) return path
  if (!path) return base
  const b = base.endsWith('/') ? base.slice(0, -1) : base
  const p = path.startsWith('/') ? path : `/${path}`
  return `${b}${p}`
}

function normalizePath(path: string) {
  // Absolute URL? leave as-is
  if (path.startsWith('http://') || path.startsWith('https://')) return path

  let p = path.startsWith('/') ? path : `/${path}`

  // Endpoints that are usually on the root (no /api prefix)
  if (p.startsWith('/actuator/') || p.startsWith('/v3/') || p === '/v3/api-docs') return p

  // Auth endpoints may be either /auth/* or /api/auth/* depending on backend
  if (p.startsWith('/auth/')) return `/api${p}`

  // Default: prefix with /api if missing
  if (!p.startsWith('/api/')) p = `/api${p}`
  return p
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = path.startsWith('http') ? path : joinUrl(config.apiUrl, normalizePath(path))
  const headers = new Headers(init.headers || {})
  headers.set('Accept', 'application/json')

  const token = auth.getToken()
  if (isUsableToken(token)) {
    headers.set('Authorization', `Bearer ${token}`)
  } else {
    headers.delete('Authorization')
  }

  // If body is a plain object, JSON encode
  let body = init.body
  if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(body)
  }

  const res = await fetch(url, { ...init, headers, body })
  const data = await parseMaybeJson(res)

  if (!res.ok) {
    // NOTE: do NOT auto-clear token on 401/403.
    // Many endpoints are intentionally public (or may be missing in dev),
    // and auto-clearing makes it look like login "doesn't save" the token.
    const msg = (data && (data.message || data.error || data.title)) || res.statusText || 'Request failed'
    throw { status: res.status, message: msg, details: data } satisfies ApiError
  }
  return data as T
}
