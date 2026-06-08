import { apiFetch, getAuthHeaders } from './client'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginApiResponse {
  message: string
  data: {
    access_token: string
    token_type: 'bearer'
  }
}

export async function login(data: LoginRequest): Promise<{ access_token: string; token_type: 'bearer' }> {
  const response = await apiFetch<LoginApiResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return response.data
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
}

export async function register(data: RegisterRequest) {
  return apiFetch('/auth/register', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
}
