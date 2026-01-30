const TOKEN_KEY = 'library.jwt'
const USER_KEY = 'library.user'

export type SessionUser = {
  id?: number
  email?: string
  firstName?: string
  lastName?: string
  role?: 'READER' | 'ADMIN' | string
  status?: string
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}
export function getFirstName(): string {
  const u = auth.getUser();
  return (u?.firstName || "").trim();
}

export function getLastName(): string {
  const u = auth.getUser();
  return (u?.lastName || "").trim();
}

export function getEmail(): string {
  const u = auth.getUser();
  return (u?.email || "").trim();
}

export function getDisplayName(): string {
  const full = `${getFirstName()} ${getLastName()}`.trim();
  return full || getEmail() || "Użytkownik";
}


function decodeJwtPayload(token: string): any | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '==='.slice((base64.length + 3) % 4)
    const json = atob(padded)
    return JSON.parse(json)
  } catch {
    return null
  }
}

export const auth = {
  getToken(): string | null {
    const t = localStorage.getItem(TOKEN_KEY)
    if (!t) return null
    if (t === 'null' || t === 'undefined') return null
    if (!t.trim()) return null
    return t
  },
  getUser(): SessionUser | null {
    return safeJsonParse<SessionUser>(localStorage.getItem(USER_KEY))
  },
  getRole(): string | null {
    const u = this.getUser()
    if (u?.role) return u.role
    const t = this.getToken()
    if (!t) return null
    const p = decodeJwtPayload(t)
    const fromCommon = p?.role || p?.userRole || p?.authorities || p?.roles
    if (typeof fromCommon === 'string') return fromCommon
    if (Array.isArray(fromCommon)) {
      const s = fromCommon.find((x: any) => typeof x === 'string')
      return s || null
    }
    return null
  },
  setSession(token: string, user?: SessionUser | null) {
    localStorage.setItem(TOKEN_KEY, token)
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },

  // legacy alias used around the app
  isAuthenticated(): boolean {
    return this.isLoggedIn()
  },

  isLoggedIn(): boolean {
    return !!this.getToken()
  },
}
