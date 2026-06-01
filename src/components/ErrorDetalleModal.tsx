import { X, FileSpreadsheet, User, AlertCircle } from 'lucide-react'
import type { ErrorDetalleSubida } from '../types'

interface Props {
  open: boolean
  detalle: ErrorDetalleSubida | null
  onClose: () => void
}

export default function ErrorDetalleModal({ open, detalle, onClose }: Props) {
  if (!open || !detalle) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="pointer-events-auto bg-surface-card rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ background: 'var(--color-danger)', color: '#fff' }}
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <h3 className="text-sm font-semibold font-display">Detalle de errores en subida</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 flex flex-col gap-5">

            {/* Info documento y usuario */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-ink">
                <FileSpreadsheet size={15} className="text-ink-muted flex-shrink-0" />
                <span className="font-medium">Documento:</span>
                <span className="text-ink-muted truncate">{detalle.documento}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-ink">
                <User size={15} className="text-ink-muted flex-shrink-0" />
                <span className="font-medium">Usuario:</span>
                <span className="text-ink-muted">{detalle.nombreUsuario}</span>
              </div>
            </div>

            {/* Separador */}
            <div style={{ height: 1, background: 'var(--color-border)' }} />

            {/* Lista de errores por columna */}
            <div>
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">
                Errores por columna ({detalle.columnas.length})
              </p>
              <ul className="flex flex-col gap-2">
                {detalle.columnas.map((col, i) => (
                  <li
                    key={i}
                    className="flex gap-3 rounded-xl px-4 py-3 text-sm"
                    style={{
                      background: 'var(--color-danger-subtle)',
                      border: '1px solid var(--color-danger-border)',
                    }}
                  >
                    <span
                      className="font-mono font-semibold flex-shrink-0"
                      style={{ color: 'var(--color-danger)' }}
                    >
                      {col.columna}
                    </span>
                    <span className="text-ink-muted leading-relaxed">{col.descripcion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-6 py-4 flex justify-end"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            <button
              onClick={onClose}
              className="text-sm font-medium text-ink-muted hover:text-ink transition-colors px-4 py-2"
            >
              Cerrar
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
