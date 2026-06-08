export interface Hormiga {
  comun_name_ant: string
  scientific_name_ant: string
  genus: string
  species: string
  region: string
  province: string
  latitude: number
  longitude: number
  endemic: boolean
  location_description: string
  additional_information: string
  dataSource: string
  color_hex?: string
}

export interface ParroquiaProperties {
  NAME_1: string  
  NAME_2: string   
  NAME_3: string   
  CC_3:   string  
}

export type AuditAction =
  | 'subir_documento'
  | 'eliminar_documento'
  | 'editar_documento'
  | 'crear_usuario'
  | 'desactivar_usuario'
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
  fecha: string                     
  nombreUsuario: string
  email: string
  rol: 'admin' | 'researcher' | 'viewer'
  accion: AuditAction
  estadoSubida?: 'ok' | 'error'
  errorDetalle?: ErrorDetalleSubida
}