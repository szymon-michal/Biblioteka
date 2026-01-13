const LS_KEY = 'library.apiUrl'

function getEnv(key: string) {
  return (import.meta as any).env?.[key]
}

export const config = {
  get apiUrl() {
    return localStorage.getItem(LS_KEY) || getEnv('VITE_API_URL') || 'http://localhost:8080'
  },
  setApiUrl(url: string) {
    localStorage.setItem(LS_KEY, url)
  },

  get openApiPath() {
    return getEnv('VITE_OPENAPI_PATH') || '/v3/api-docs'
  },

  get authLoginPath() {
    return getEnv('VITE_AUTH_LOGIN_PATH') || '/api/auth/login'
  },

  // ✅ DODAJ TO
  get authRegisterPath() {
    return getEnv('VITE_AUTH_REGISTER_PATH') || '/api/auth/register'
  },
}
