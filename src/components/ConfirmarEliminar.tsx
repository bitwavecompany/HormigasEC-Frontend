import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  titulo: string
  descripcion: ReactNode
  onConfirm: () => void
  onClose: () => void
  loading?: boolean
}

export default function ConfirmarEliminar({
  open,
  titulo,
  descripcion,
  onConfirm,
  onClose,
  loading = false,
}: Props) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="pointer-events-auto bg-surface-card rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold font-display text-ink">{titulo}</h3>
            <button onClick={onClose} className="text-ink-muted hover:text-ink transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="text-sm text-ink-muted mb-5">{descripcion}</div>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="text-sm text-ink-muted hover:text-ink transition-colors px-4 py-2"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="text-sm font-medium bg-danger text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
