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

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${config.apiUrl}${path}`
  const headers = new Headers(init.headers || {})
  headers.set('Accept', 'application/json')

  const token = auth.getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  // If body is a plain object, JSON encode
  let body = init.body
  if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(body)
  }

  const res = await fetch(url, { ...init, headers, body })
  const data = await parseMaybeJson(res)

  if (!res.ok) {
    const msg = (data && (data.message || data.error || data.title)) || res.statusText || 'Request failed'
    throw { status: res.status, message: msg, details: data } satisfies ApiError
  }
  return data as T
}
