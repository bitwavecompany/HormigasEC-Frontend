import { useState, useCallback } from 'react'
import type { AuditEntry, ErrorDetalleSubida, AuditAction } from '../types'

const STORAGE_KEY = 'hormigas_audit_log'

function makeDate(daysAgo: number, hour: number, min: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, min, 0, 0)
  return d.toISOString()
}

function buildSeed(): AuditEntry[] {
  return [
    {
      id: 'seed-1',
      fecha: makeDate(0, 9, 14),
      nombreUsuario: 'Carlos Mendoza',
      email: 'cmendoza@uce.edu.ec',
      rol: 'admin',
      accion: 'subir_documento',
      estadoSubida: 'ok',
    },
    {
      id: 'seed-2',
      fecha: makeDate(0, 10, 32),
      nombreUsuario: 'Lucía Torres',
      email: 'ltorres@uce.edu.ec',
      rol: 'researcher',
      accion: 'subir_documento',
      estadoSubida: 'error',
      errorDetalle: {
        documento: 'muestras_pichincha_2026.xlsx',
        nombreUsuario: 'Lucía Torres',
        columnas: [
          { columna: 'latitud', descripcion: 'Valor fuera de rango para Ecuador (-5.02 a 1.45)' },
          { columna: 'altitud_m', descripcion: 'Campo vacío en filas 12, 15 y 22' },
          { columna: 'nombre_cientifico', descripcion: 'Formato incorrecto: falta género o especie en fila 8' },
        ],
      },
    },
    {
      id: 'seed-3',
      fecha: makeDate(0, 11, 5),
      nombreUsuario: 'Carlos Mendoza',
      email: 'cmendoza@uce.edu.ec',
      rol: 'admin',
      accion: 'crear_usuario',
    },
    {
      id: 'seed-4',
      fecha: makeDate(1, 8, 47),
      nombreUsuario: 'Ana Suárez',
      email: 'asuarez@uce.edu.ec',
      rol: 'researcher',
      accion: 'editar_documento',
    },
    {
      id: 'seed-5',
      fecha: makeDate(1, 14, 20),
      nombreUsuario: 'Ana Suárez',
      email: 'asuarez@uce.edu.ec',
      rol: 'researcher',
      accion: 'subir_documento',
      estadoSubida: 'ok',
    },
    {
      id: 'seed-6',
      fecha: makeDate(1, 15, 58),
      nombreUsuario: 'Carlos Mendoza',
      email: 'cmendoza@uce.edu.ec',
      rol: 'admin',
      accion: 'editar_usuario',
    },
    {
      id: 'seed-7',
      fecha: makeDate(2, 9, 0),
      nombreUsuario: 'Jorge Vega',
      email: 'jvega@uce.edu.ec',
      rol: 'viewer',
      accion: 'subir_documento',
      estadoSubida: 'error',
      errorDetalle: {
        documento: 'hormigas_esmeraldas_mayo.xlsx',
        nombreUsuario: 'Jorge Vega',
        columnas: [
          { columna: 'longitud', descripcion: 'Valor positivo en lugar de negativo (Ecuador está en longitud oeste)' },
          { columna: 'color_hex', descripcion: 'Código hex inválido en filas 3, 7 y 19' },
        ],
      },
    },
    {
      id: 'seed-8',
      fecha: makeDate(2, 11, 30),
      nombreUsuario: 'Carlos Mendoza',
      email: 'cmendoza@uce.edu.ec',
      rol: 'admin',
      accion: 'eliminar_documento',
    },
    {
      id: 'seed-9',
      fecha: makeDate(3, 16, 45),
      nombreUsuario: 'Lucía Torres',
      email: 'ltorres@uce.edu.ec',
      rol: 'researcher',
      accion: 'editar_documento',
    },
    {
      id: 'seed-10',
      fecha: makeDate(3, 17, 10),
      nombreUsuario: 'Carlos Mendoza',
      email: 'cmendoza@uce.edu.ec',
      rol: 'admin',
      accion: 'eliminar_usuario',
    },
    {
      id: 'seed-11',
      fecha: makeDate(4, 8, 5),
      nombreUsuario: 'Ana Suárez',
      email: 'asuarez@uce.edu.ec',
      rol: 'researcher',
      accion: 'subir_documento',
      estadoSubida: 'ok',
    },
    {
      id: 'seed-12',
      fecha: makeDate(5, 10, 22),
      nombreUsuario: 'Carlos Mendoza',
      email: 'cmendoza@uce.edu.ec',
      rol: 'admin',
      accion: 'crear_usuario',
    },
    {
      id: 'seed-13',
      fecha: makeDate(6, 13, 48),
      nombreUsuario: 'Lucía Torres',
      email: 'ltorres@uce.edu.ec',
      rol: 'researcher',
      accion: 'subir_documento',
      estadoSubida: 'error',
      errorDetalle: {
        documento: 'inventario_loja_2026.xlsx',
        nombreUsuario: 'Lucía Torres',
        columnas: [
          { columna: 'subfamilia', descripcion: 'Valor no reconocido: "Myrmicinae2" no existe en el catálogo' },
          { columna: 'descripcion', descripcion: 'Texto supera el límite de 500 caracteres en fila 4' },
        ],
      },
    },
    {
      id: 'seed-14',
      fecha: makeDate(7, 9, 33),
      nombreUsuario: 'Jorge Vega',
      email: 'jvega@uce.edu.ec',
      rol: 'viewer',
      accion: 'editar_documento',
    },
    {
      id: 'seed-15',
      fecha: makeDate(8, 14, 0),
      nombreUsuario: 'Ana Suárez',
      email: 'asuarez@uce.edu.ec',
      rol: 'researcher',
      accion: 'eliminar_documento',
    },
  ]
}

function loadEntries(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seed = buildSeed()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seed = buildSeed()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    return parsed as AuditEntry[]
  } catch {
    return buildSeed()
  }
}

function saveEntries(entries: AuditEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export interface AddEntryPayload {
  nombreUsuario: string
  email: string
  rol: 'admin' | 'researcher' | 'viewer'
  accion: AuditAction
  estadoSubida?: 'ok' | 'error'
  errorDetalle?: ErrorDetalleSubida
}

export function useAuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>(() => loadEntries())

  const addEntry = useCallback((payload: AddEntryPayload) => {
    const newEntry: AuditEntry = {
      ...payload,
      id: crypto.randomUUID(),
      fecha: new Date().toISOString(),
    }
    setEntries(prev => {
      const updated = [newEntry, ...prev]
      saveEntries(updated)
      return updated
    })
  }, [])

  const clearEntries = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setEntries([])
  }, [])

  return { entries, addEntry, clearEntries }
}
