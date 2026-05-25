import { apiFetch, getAuthHeaders } from './client'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: 'bearer'
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
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
