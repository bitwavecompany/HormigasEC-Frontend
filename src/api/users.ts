import { apiFetch, getAuthHeaders } from './client'

export interface UserRead {
  id: number
  email: string
  full_name: string
  role: 'admin' | 'researcher' | 'viewer'
  is_active: boolean
}

// Backend UserUpdate only accepts: full_name, role, is_active
// email and password are NOT supported by the backend PATCH /users/{id} (TODO in backend)
export interface UpdateUserRequest {
  full_name?: string
  role?: 'admin' | 'researcher' | 'viewer'
  is_active?: boolean
}

export async function listUsers(): Promise<UserRead[]> {
  return apiFetch<UserRead[]>('/users', {
    method: 'GET',
    headers: getAuthHeaders(),
  })
}

// NOTE: PATCH /users/{id} and DELETE /users/{id} are TODO in the backend.
// These functions are defined here for when the backend implements them.
// They will return 404/405 until the backend is ready.

export async function updateUser(id: number, data: UpdateUserRequest): Promise<UserRead> {
  return apiFetch<UserRead>(`/users/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
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
    throw new Error(error?.detail ?? 'Error al eliminar usuario')
  }
}

// createUser uses POST /auth/register — backend accepts email, password, full_name, role
export async function createUser(data: { email: string; password: string; full_name: string; role: 'admin' | 'researcher' | 'viewer' }): Promise<UserRead> {
  return apiFetch<UserRead>('/auth/register', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ email: data.email, password: data.password, full_name: data.full_name, role: data.role }),
  })
}
