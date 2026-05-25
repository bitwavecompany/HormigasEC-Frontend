import { apiFetch, getAuthHeaders, getBearerHeaders } from './client'

export interface ExcelFileRead {
  id: number
  file_name: string
  content_type: string
  uploaded_by_user_id: number
  uploaded_by_name: string
  uploaded_at: string
  updated_at: string
}

export async function listExcels(): Promise<ExcelFileRead[]> {
  return apiFetch<ExcelFileRead[]>('/excels', {
    method: 'GET',
    headers: getAuthHeaders(),
  })
}

export async function uploadExcel(file: File): Promise<ExcelFileRead> {
  const formData = new FormData()
  formData.append('file', file)
  return apiFetch<ExcelFileRead>('/excels', {
    method: 'POST',
    headers: getBearerHeaders(), // NO Content-Type header — browser sets multipart boundary
    body: formData,
  })
}

export async function renameExcel(id: number, fileName: string): Promise<ExcelFileRead> {
  return apiFetch<ExcelFileRead>(`/excels/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ file_name: fileName }),
  })
}

export async function downloadExcel(id: number, fileName: string): Promise<void> {
  const token = localStorage.getItem('hormigas_token')
  let response: Response
  try {
    response = await fetch(`${import.meta.env.VITE_API_URL}/excels/${id}/download`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor')
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.detail ?? 'Error al descargar el archivo')
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function deleteExcel(id: number): Promise<void> {
  const token = localStorage.getItem('hormigas_token')
  let response: Response
  try {
    response = await fetch(`${import.meta.env.VITE_API_URL}/excels/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor')
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.detail ?? 'Error al eliminar el archivo')
  }
}
