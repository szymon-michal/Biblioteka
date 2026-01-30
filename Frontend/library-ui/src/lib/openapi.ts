import { apiFetch } from './api'
import { config } from './config'

export type OpenApiDoc = {
  openapi?: string
  swagger?: string
  info?: { title?: string; version?: string }
  servers?: Array<{ url: string }>
  paths?: Record<string, any>
  components?: Record<string, any>
}


let cached: OpenApiDoc | null = null
let cachedAt = 0

export async function getOpenApi(force = false): Promise<OpenApiDoc | null> {
  const now = Date.now()
  if (!force && cached && now - cachedAt < 60_000) return cached
  try {
    cached = await apiFetch<OpenApiDoc>(config.openApiPath)
    cachedAt = now
    return cached
  } catch {
    return null
  }
}

export function guessResourcePaths(doc: OpenApiDoc | null) {
  const all = Object.keys(doc?.paths || {})
  const pick = (keywords: string[]) => {
    const lower = all.map((p) => p.toLowerCase())
    for (const k of keywords) {
      const i = lower.findIndex((p) => p.includes(k))
      if (i >= 0) return all[i]
    }
    return ''
  }
  return {
    books: pick(['books', 'book', 'catalog']),
    members: pick(['members', 'readers', 'users', 'clients', 'patrons']),
    loans: pick(['loans', 'borrows', 'borrow', 'rentals', 'lendings']),
  }
}
