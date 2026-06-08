import { apiFetch, getAuthHeaders } from './client'

export interface UserRead {
  id: number
  email: string
  full_name: string
  role: 'admin' | 'researcher' | 'viewer'
  is_active: boolean
}

export interface UpdateUserRequest {
  full_name?: string
  role?: 'admin' | 'researcher' | 'viewer'
  is_active?: boolean
}

export interface ApiResponse<T> {
  message: string
  data: T
}

export async function getMe(): Promise<UserRead> {
  const res = await apiFetch<ApiResponse<UserRead>>('/users/me', {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return res.data 
}

export async function listUsers(): Promise<UserRead[]> {
  const res = await apiFetch<ApiResponse<UserRead[]>>('/users', {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return res.data
}

export async function updateUser(id: number, data: UpdateUserRequest): Promise<UserRead> {
  const res = await apiFetch<ApiResponse<UserRead>>(`/users/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  return res.data
}

export async function deleteUser(id: number): Promise<void> {
  const token = localStorage.getItem('hormigas_token')
  let response: Response
  try {
    response = await fetch(`${import.meta.env.VITE_API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor')
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.detail ?? 'Error al desactivar usuario')
  }
}

export async function createUser(data: { email: string; password: string; full_name: string; role: 'admin' | 'researcher' | 'viewer' }): Promise<UserRead> {
  const res = await apiFetch<ApiResponse<UserRead>>('/auth/register', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ email: data.email, password: data.password, full_name: data.full_name, role: data.role }),
  })
  return res.data
}