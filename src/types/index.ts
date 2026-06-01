export interface Hormiga {
  id: number
  nombre_comun: string
  nombre_cientifico: string
  subfamilia: string
  region: string
  provincia: string
  altitud_m: number
  latitud: number
  longitud: number
  descripcion: string
  imagen_url: string
  color_hex: string
}

// ─── Auditoría / Historial ────────────────────────────────────────────────────

export type AuditAction =
  | 'subir_documento'
  | 'eliminar_documento'
  | 'editar_documento'
  | 'crear_usuario'
  | 'eliminar_usuario'
  | 'editar_usuario'

export interface ErrorColumna {
  columna: string
  descripcion: string
}

export interface ErrorDetalleSubida {
  documento: string
  nombreUsuario: string
  columnas: ErrorColumna[]
}

export interface AuditEntry {
  id: string
  fecha: string                            // ISO string
  nombreUsuario: string
  email: string
  rol: 'admin' | 'researcher' | 'viewer'
  accion: AuditAction
  // Solo presente en acción subir_documento
  estadoSubida?: 'ok' | 'error'
  errorDetalle?: ErrorDetalleSubida
}
