import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Upload, Trash2, Download, Pencil, X, FileSpreadsheet, File } from 'lucide-react'
import ConfirmarAccion from '../../components/ConfirmarAccion'
import {
  listExcels,
  uploadExcel,
  renameExcel,
  downloadExcel,
  deleteExcel,
} from '../../api/excels'
import type { ExcelFileRead } from '../../api/excels'

const EXCEL_EXTENSIONS = /\.(xlsx|xls)$/i
const EXCEL_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ArchivosModule() {
  const [archivos, setArchivos] = useState<ExcelFileRead[]>([])
  const [loading, setLoading] = useState(true)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [nombrePersonalizado, setNombrePersonalizado] = useState('')
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editTarget, setEditTarget] = useState<ExcelFileRead | null>(null)
  const [nombreEdit, setNombreEdit] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<ExcelFileRead | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    listExcels()
      .then(data => setArchivos(data))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    if (!EXCEL_MIME_TYPES.includes(file.type) && !EXCEL_EXTENSIONS.test(file.name)) {
      toast.error('Solo se permiten archivos Excel (.xlsx, .xls)')
      e.target.value = ''
      return
    }
    setArchivoSeleccionado(file)
    if (!nombrePersonalizado.trim()) {
      setNombrePersonalizado(file.name)
    }
  }

  const handleSubir = async () => {
    if (!archivoSeleccionado) { toast.error('Selecciona un archivo'); return }
    setSubiendo(true)
    try {
      const newFile = await uploadExcel(archivoSeleccionado, nombrePersonalizado.trim() || archivoSeleccionado.name)
      const customName = nombrePersonalizado.trim()
      let finalFile = newFile
      if (customName && customName !== archivoSeleccionado.name) {
        finalFile = await renameExcel(newFile.id, customName)
      }
      setArchivos(prev => [finalFile, ...prev])
      toast.success('Archivo subido correctamente')
      cerrarUpload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al subir el archivo')
    } finally {
      setSubiendo(false)
    }
  }

  const cerrarUpload = () => {
    setUploadOpen(false)
    setNombrePersonalizado('')
    setArchivoSeleccionado(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDescargar = async (archivo: ExcelFileRead) => {
    try {
      await downloadExcel(archivo.id, archivo.file_name)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al descargar el archivo')
    }
  }

  const handleEliminar = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteExcel(deleteTarget.id)
      setArchivos(prev => prev.filter(a => a.id !== deleteTarget.id))
      toast.success('Archivo eliminado')
      setDeleteTarget(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar el archivo')
    } finally {
      setDeleting(false)
    }
  }

  const abrirEdit = (archivo: ExcelFileRead) => {
    setEditTarget(archivo)
    setNombreEdit(archivo.title)
  }

  const handleGuardarEdit = async () => {
    if (!editTarget) return
    if (!nombreEdit.trim()) { toast.error('El nombre no puede estar vacío'); return }
    try {
      const updated = await renameExcel(editTarget.id, nombreEdit.trim())
      setArchivos(prev => prev.map(a => a.id === updated.id ? updated : a))
      toast.success('Nombre actualizado')
      setEditTarget(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al actualizar el nombre')
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
        <h2 className="text-base sm:text-lg font-semibold font-display text-ink">Gestión de archivos</h2>
        <button
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 text-sm font-medium bg-[#166534] text-white px-4 py-2 rounded-lg hover:bg-[#14532d] transition-colors"
        >
          <Upload size={15} />
          <span className="hidden sm:inline">Subir archivo</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="w-full overflow-auto">
          <table className="w-full min-w-max text-sm border-collapse">
            <thead className="bg-surface-muted">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-border">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-border">Subido por</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-border">Subido</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-border">Modificado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-3"><div className="h-4 bg-surface-muted rounded animate-pulse w-40" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-surface-muted rounded animate-pulse w-32" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-surface-muted rounded animate-pulse w-28" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-surface-muted rounded animate-pulse w-28" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-surface-muted rounded animate-pulse w-16" /></td>
                  </tr>
                ))
              ) : archivos.length === 0 ? (
                <tr className="border-b border-border">
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                    No hay archivos registrados. Sube el primero usando el botón de arriba.
                  </td>
                </tr>
              ) : (
                archivos.map(a => (
                  <tr key={a.id} className="border-b border-border hover:bg-surface-muted transition-colors">
                    <td className="px-4 py-3 text-ink font-medium">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet size={15} className="text-brand flex-shrink-0" />
                        {a.title}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{a.uploaded_by_name}</td>
                    <td className="px-4 py-3 text-ink-muted whitespace-nowrap">{formatFecha(a.uploaded_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {a.uploaded_at !== a.updated_at
                        ? <span className="text-ink-muted">{formatFecha(a.updated_at)}</span>
                        : <span className="text-ink-faint">Sin cambios</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDescargar(a)}
                          title="Descargar"
                          className="p-1.5 rounded-md text-ink-muted hover:text-brand hover:bg-brand-light transition-colors"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          onClick={() => abrirEdit(a)}
                          title="Editar nombre"
                          className="p-1.5 rounded-md text-ink-muted hover:text-brand hover:bg-brand-light transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(a)}
                          title="Eliminar"
                          className="p-1.5 rounded-md text-ink-muted hover:text-danger hover:bg-danger-subtle transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {uploadOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={cerrarUpload} />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="pointer-events-auto bg-surface-card rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <File size={20} className="text-brand" />
                  <h3 className="text-base font-semibold font-display text-ink">Subir archivo Excel</h3>
                </div>
                <button onClick={cerrarUpload} className="text-ink-muted hover:text-ink transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <div
                  className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-brand hover:bg-brand-light/40 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileSpreadsheet size={28} className="text-brand opacity-70" />
                  {archivoSeleccionado ? (
                    <p className="text-sm text-ink font-medium text-center break-all">{archivoSeleccionado.name}</p>
                  ) : (
                    <>
                      <p className="text-sm text-ink-muted">Haz clic para seleccionar un archivo</p>
                      <p className="text-xs text-ink-faint">Solo archivos Excel (.xlsx, .xls)</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Nombre personalizado</label>
                  <input
                    type="text"
                    placeholder="Ej: Datos_hormigas_2024"
                    value={nombrePersonalizado}
                    onChange={e => setNombrePersonalizado(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-ink bg-surface outline-none focus:border-brand transition-colors"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={cerrarUpload}
                  className="text-sm text-ink-muted hover:text-ink transition-colors px-4 py-2"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubir}
                  disabled={subiendo || !archivoSeleccionado}
                  className="text-sm font-medium bg-[#166534] text-white px-4 py-2 rounded-lg hover:bg-[#14532d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {subiendo ? 'Subiendo…' : 'Subir archivo'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {editTarget && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setEditTarget(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="pointer-events-auto bg-surface-card rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <File size={20} className="text-brand" />
                  <h3 className="text-base font-semibold font-display text-ink">Editar nombre</h3>
                </div>
                <button onClick={() => setEditTarget(null)} className="text-ink-muted hover:text-ink transition-colors">
                  <X size={18} />
                </button>
              </div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Nuevo nombre</label>
              <input
                type="text"
                value={nombreEdit}
                onChange={e => setNombreEdit(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGuardarEdit()}
                autoFocus
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-ink bg-surface outline-none focus:border-brand transition-colors"
              />
              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => setEditTarget(null)}
                  className="text-sm text-ink-muted hover:text-ink transition-colors px-4 py-2"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardarEdit}
                  className="text-sm font-medium bg-[#166534] text-white px-4 py-2 rounded-lg hover:bg-[#14532d] transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmarAccion
        open={!!deleteTarget}
        titulo="Eliminar archivo"
        descripcion={
          deleteTarget
            ? <>¿Eliminar <span className="font-medium text-ink">"{deleteTarget.title}"</span>? Esta acción no se puede deshacer.</>
            : null
        }
        onConfirm={handleEliminar}
        onClose={() => setDeleteTarget(null)}
        loading={deleting}
      />

    </div>
  )
}
