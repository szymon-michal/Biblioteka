const KEY = 'library.jwt'

export const auth = {
  getToken(): string | null {
    return localStorage.getItem(KEY)
  },
  setToken(token: string) {
    localStorage.setItem(KEY, token)
  },
  clear() {
    localStorage.removeItem(KEY)
  },
  isAuthenticated(): boolean {
    return !!localStorage.getItem(KEY)
  },
}
