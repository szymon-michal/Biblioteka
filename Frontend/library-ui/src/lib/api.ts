import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError } from "axios";

/**
 * API_BASE_URL:
 * - domyślnie: http://localhost:8080/api
 * - nadpisz przez .env: VITE_API_URL=http://localhost:8080/api
 */
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL?.toString() || "http://localhost:8080/api";

const ACCESS_TOKEN_KEY = "library.jwt";

export const tokenStore = {
  get(): string | null {
    const t = localStorage.getItem(ACCESS_TOKEN_KEY);
    return t && t.trim() ? t : null;
  },
  set(token: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },
};

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  // Jeśli refresh-token jest w httpOnly cookie -> ustaw true + backend CORS allowCredentials(true)
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

export const authApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

function shouldAttachAuth(config: AxiosRequestConfig): boolean {
  const url = String(config.url || "");
  if (url.startsWith("/auth/login")) return false;
  if (url.startsWith("/auth/register")) return false;
  if (url.startsWith("/auth/refresh-token")) return false;
  return true;
}

api.interceptors.request.use((config) => {
  if (!config.headers) config.headers = {};

  if (shouldAttachAuth(config)) {
    const token = tokenStore.get();
    if (token) (config.headers as any).Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err: AxiosError) => {
    // 401 = brak tokenu / zły token / brak roli
    return Promise.reject(err);
  }
);

/**
 * LOGIN helper:
 * backend zwykle zwraca { token: "..." } albo { access_token: "..." }
 */
export async function login(email: string, password: string) {
  const res = await authApi.post("/auth/login", { email, password });
  const data: any = res.data;

  const token = data?.token || data?.access_token || data?.accessToken || data?.jwt || null;
  if (!token) throw new Error("Brak tokenu w odpowiedzi /auth/login.");

  tokenStore.set(token);
  return data;
}

export function logout() {
  tokenStore.clear();
}

/**
 * Generic fetch wrapper using the authenticated api instance
 */
export async function apiFetch<T>(url: string, config?: AxiosRequestConfig & { method?: string; body?: any }): Promise<T> {
  const method = config?.method?.toUpperCase() || 'GET';
  const data = config?.body;

  let response;
  if (method === 'GET') {
    response = await api.get<T>(url, config);
  } else if (method === 'POST') {
    response = await api.post<T>(url, data, config);
  } else if (method === 'PUT') {
    response = await api.put<T>(url, data, config);
  } else if (method === 'DELETE') {
    response = await api.delete<T>(url, config);
  } else if (method === 'PATCH') {
    response = await api.patch<T>(url, data, config);
  } else {
    response = await api.request<T>({ ...config, url, method, data });
  }

  return response.data;
}
