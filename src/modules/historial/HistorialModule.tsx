import { useState, useMemo } from 'react'
import {
  Upload,
  Trash2,
  Pencil,
  UserPlus,
  UserMinus,
  UserCog,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  AlertCircle 
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuditLog } from '../../hooks/useAuditLog'
import ErrorDetalleModal from '../../components/ErrorDetalleModal'
import type { AuditAction, AuditEntry, ErrorDetalleSubida } from '../../types'

const ACCION_LABELS: Record<AuditAction, string> = {
  subir_documento: 'Subir documento',
  eliminar_documento: 'Eliminar documento',
  editar_documento: 'Editar documento',
  crear_usuario: 'Crear usuario',
  desactivar_usuario: 'Desactivar usuario',
  editar_usuario: 'Editar usuario',
}

const ACCION_ICONS: Record<AuditAction, LucideIcon> = {
  subir_documento: Upload,
  eliminar_documento: Trash2,
  editar_documento: Pencil,
  crear_usuario: UserPlus,
  desactivar_usuario: UserMinus,
  editar_usuario: UserCog,
}

const ACCION_COLORS: Record<AuditAction, string> = {
  subir_documento: 'text-brand',
  eliminar_documento: 'text-danger',
  editar_documento: 'text-blue-600',
  crear_usuario: 'text-brand',
  desactivar_usuario: 'text-danger',
  editar_usuario: 'text-blue-600',
}

const ROL_LABELS: Record<string, string> = {
  admin: 'Admin',
  researcher: 'Investigador',
  viewer: 'Visitante',
}

const ROL_CLASSES: Record<string, string> = {
  admin: 'bg-brand-light text-brand-dark',
  researcher: 'bg-blue-50 text-blue-700',
  viewer: 'bg-surface-muted text-ink-muted',
}

const ACCION_OPTIONS: { value: '' | AuditAction; label: string }[] = [
  { value: '', label: 'Todas las acciones' },
  { value: 'subir_documento', label: 'Subir documento' },
  { value: 'eliminar_documento', label: 'Eliminar documento' },
  { value: 'editar_documento', label: 'Editar documento' },
  { value: 'crear_usuario', label: 'Crear usuario' },
  { value: 'desactivar_usuario', label: 'Desactivar usuario' },
  { value: 'editar_usuario', label: 'Editar usuario' },
]

const PAGE_SIZE = 10

function formatFecha(iso: string): { fecha: string; hora: string } {
  const d = new Date(iso)
  return {
    fecha: d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    hora: d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
  }
}

function isSameDay(iso: string, dateStr: string): boolean {
  if (!dateStr) return true
  const d = new Date(iso)
  const ref = new Date(dateStr + 'T00:00:00')
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  )
}

export default function HistorialModule() {
  const { entries } = useAuditLog()

  const [busqueda, setBusqueda] = useState('')
  const [filtroAccion, setFiltroAccion] = useState<'' | AuditAction>('')
  const [filtroFecha, setFiltroFecha] = useState('')

  const [pagina, setPagina] = useState(1)

  const [modalDetalle, setModalDetalle] = useState<ErrorDetalleSubida | null>(null)

  const entradsFiltradas = useMemo(() => {
    return entries.filter(e => {
      const matchBusqueda =
        !busqueda ||
        e.nombreUsuario.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.email.toLowerCase().includes(busqueda.toLowerCase())
      const matchAccion = !filtroAccion || e.accion === filtroAccion
      const matchFecha = !filtroFecha || isSameDay(e.fecha, filtroFecha)
      return matchBusqueda && matchAccion && matchFecha
    })
  }, [entries, busqueda, filtroAccion, filtroFecha])

  const totalPaginas = Math.max(1, Math.ceil(entradsFiltradas.length / PAGE_SIZE))
  const paginaActual = Math.min(pagina, totalPaginas)

  const entradasPagina = useMemo(() => {
    const inicio = (paginaActual - 1) * PAGE_SIZE
    return entradsFiltradas.slice(inicio, inicio + PAGE_SIZE)
  }, [entradsFiltradas, paginaActual])

  const handleFiltroChange = () => setPagina(1)

  return (
    <div className="h-full flex flex-col gap-0 overflow-hidden">

      <div className="flex-shrink-0 px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl"
            style={{ background: 'var(--color-brand-subtle)' }}
          >
            <ClipboardList size={18} style={{ color: 'var(--color-brand)' }} />
          </div>
          <div>
            <h1 className="text-base font-bold font-display text-ink leading-tight">
              Historial de actividad
            </h1>
            <p className="text-xs text-ink-muted">
              Registro de auditoría de acciones del sistema
            </p>
          </div>
        </div>
        <span className="text-xs text-ink-faint">
          {entradsFiltradas.length} {entradsFiltradas.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      <div className="flex-shrink-0 px-6 pb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar por usuario o correo…"
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); handleFiltroChange() }}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-border bg-surface-card text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        <div className="relative">
          <Filter
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
          />
          <select
            value={filtroAccion}
            onChange={e => { setFiltroAccion(e.target.value as '' | AuditAction); handleFiltroChange() }}
            className="pl-8 pr-8 py-2 text-sm rounded-xl border border-border bg-surface-card text-ink focus:outline-none focus:border-brand transition-colors appearance-none cursor-pointer"
          >
            {ACCION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <input
            type="date"
            value={filtroFecha}
            onChange={e => { setFiltroFecha(e.target.value); handleFiltroChange() }}
            className="px-3 py-2 text-sm rounded-xl border border-border bg-surface-card text-ink focus:outline-none focus:border-brand transition-colors cursor-pointer"
          />
        </div>

        {(busqueda || filtroAccion || filtroFecha) && (
          <button
            onClick={() => {
              setBusqueda('')
              setFiltroAccion('')
              setFiltroFecha('')
              setPagina(1)
            }}
            className="text-xs text-ink-muted hover:text-ink transition-colors px-3 py-2 rounded-xl hover:bg-surface-muted"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="flex-1 px-6 pb-6 overflow-auto min-h-0">
        <div
          className="bg-surface-card rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap">
                  Fecha y hora
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  Usuario
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  Rol
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  Acción
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {entradasPagina.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-ink-muted text-sm">
                    No se encontraron registros con los filtros actuales.
                  </td>
                </tr>
              ) : (
                entradasPagina.map((entry, idx) => (
                  <FilaAuditoria
                    key={entry.id}
                    entry={entry}
                    striped={idx % 2 === 1}
                    onVerError={detalle => setModalDetalle(detalle)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-4 px-1">
            <span className="text-xs text-ink-muted">
              Página {paginaActual} de {totalPaginas}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPaginas || Math.abs(p - paginaActual) <= 1)
                .reduce<(number | '…')[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('…')
                  acc.push(p)
                  return acc
                }, [])
                .map((item, i) =>
                  item === '…' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-ink-faint text-xs">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPagina(item as number)}
                      className="min-w-[30px] h-[30px] rounded-lg text-xs font-medium transition-colors"
                      style={
                        item === paginaActual
                          ? { background: 'var(--color-brand)', color: '#fff' }
                          : { color: 'var(--color-ink-muted)' }
                      }
                    >
                      {item}
                    </button>
                  )
                )}
              <button
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ErrorDetalleModal
        open={modalDetalle !== null}
        detalle={modalDetalle}
        onClose={() => setModalDetalle(null)}
      />
    </div>
  )
}

interface FilaProps {
  entry: AuditEntry
  striped: boolean
  onVerError: (detalle: ErrorDetalleSubida) => void
}

function FilaAuditoria({ entry, striped, onVerError }: FilaProps) {
  const { fecha, hora } = formatFecha(entry.fecha)
  
  const Icon = ACCION_ICONS[entry.accion] || AlertCircle
  const accionColor = ACCION_COLORS[entry.accion] || 'text-ink-muted'
  const accionLabel = ACCION_LABELS[entry.accion] || entry.accion
  const rolClass = ROL_CLASSES[entry.rol] ?? 'bg-surface-muted text-ink-muted'

  return (
    <tr
      style={{
        background: striped ? 'var(--color-surface-muted)' : 'transparent',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="font-medium text-ink text-sm">{hora}</span>
        <span className="block text-xs text-ink-muted">{fecha}</span>
      </td>

      <td className="px-4 py-3">
        <span className="font-medium text-ink text-sm">{entry.nombreUsuario}</span>
        <span className="block text-xs text-ink-muted">{entry.email}</span>
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        <span
          className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${rolClass}`}
        >
          {ROL_LABELS[entry.rol] ?? entry.rol}
        </span>
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${accionColor}`}>
          <Icon size={14} className="flex-shrink-0" />
          {accionLabel}
        </span>
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        {entry.accion === 'subir_documento' ? (
          <EstadoSubida
            estado={entry.estadoSubida ?? 'ok'}
            detalle={entry.errorDetalle ?? null}
            onVerError={onVerError}
          />
        ) : (
          <span className="text-ink-faint text-xs">—</span>
        )}
      </td>
    </tr>
  )
}

interface EstadoProps {
  estado: 'ok' | 'error'
  detalle: ErrorDetalleSubida | null
  onVerError: (detalle: ErrorDetalleSubida) => void
}

function EstadoSubida({ estado, detalle, onVerError }: EstadoProps) {
  if (estado === 'ok') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
        <CheckCircle2 size={12} />
        Sin errores
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{
          color: 'var(--color-danger)',
          background: 'var(--color-danger-subtle)',
          border: '1px solid var(--color-danger-border)',
        }}
      >
        <XCircle size={12} />
        Con errores
      </span>
      {detalle && (
        <button
          onClick={() => onVerError(detalle)}
          title="Ver detalle de errores"
          className="ml-1 p-1 rounded-lg text-ink-muted hover:text-danger hover:bg-danger-subtle transition-colors"
        >
          <ExternalLink size={13} />
        </button>
      )}
    </span>
  )
}