const API_URL = import.meta.env.VITE_API_URL
const TOKEN_KEY = 'hormigas_token'

interface ApiErrorDetail {
  msg: string
  loc: string[]
}

interface ApiErrorResponse {
  detail: string | ApiErrorDetail[]
  error_code?: string
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getAuthHeaders(): HeadersInit {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export function getBearerHeaders(): HeadersInit {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function parseApiError(error: ApiErrorResponse): string {
  if (typeof error.detail === 'string') return error.detail
  if (Array.isArray(error.detail) && error.detail.length > 0) {
    const raw = error.detail[0].msg
    const colonIndex = raw.indexOf(': ')
    return colonIndex !== -1 ? raw.slice(colonIndex + 2) : raw
  }
  return 'Error de conexión con el servidor'
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, options)
  } catch {
    throw new Error('No se pudo conectar con el servidor')
  }
  if (!response.ok) {
    try {
      const error: ApiErrorResponse = await response.json()
      throw new Error(parseApiError(error))
    } catch (e) {
      if (e instanceof Error) throw e
      throw new Error('Error de conexión con el servidor')
    }
  }
  return response.json() as Promise<T>
}
