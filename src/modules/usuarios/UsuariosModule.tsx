import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { UserPlus, X, Pencil, Trash2, CircleUserRound } from 'lucide-react'
import { listUsers, createUser, updateUser, deleteUser } from '../../api/users'
import type { UserRead } from '../../api/users'
import ConfirmarEliminar from '../../components/ConfirmarEliminar'

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

const ROL_DESC: Record<string, string> = {
  admin: 'Acceso completo al sistema: mapa, archivos y gestión de usuarios.',
  researcher: 'Puede subir, descargar, editar y eliminar archivos. Sin acceso a usuarios.',
  viewer: 'Solo puede consultar el mapa. No puede modificar ni agregar nada.',
}

export default function UsuariosModule() {
  const [users, setUsers] = useState<UserRead[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'researcher' | 'viewer'>('viewer')
  const [creating, setCreating] = useState(false)

  const [editTarget, setEditTarget] = useState<UserRead | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editRole, setEditRole] = useState<'admin' | 'researcher' | 'viewer'>('viewer')
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<UserRead | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    listUsers()
      .then(data => setUsers(data))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleCloseModal = () => {
    setModalOpen(false)
    setFullName('')
    setEmail('')
    setPassword('')
    setRole('viewer')
  }

  const handleOpenEdit = (u: UserRead) => {
    setEditTarget(u)
    setEditFullName(u.full_name)
    setEditRole(u.role)
  }

  const handleCloseEdit = () => {
    setEditTarget(null)
  }

  const handleSaveEdit = async () => {
    if (!editTarget) return
    if (!editFullName.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    setSaving(true)
    try {
      const updated = await updateUser(editTarget.id, {
        full_name: editFullName.trim(),
        role: editRole,
      })
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
      toast.success('Usuario actualizado')
      handleCloseEdit()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteUser(deleteTarget.id)
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
      toast.success('Usuario eliminado')
      setDeleteTarget(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  const handleCreate = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      toast.error('Completa todos los campos')
      return
    }
    setCreating(true)
    try {
      const newUser = await createUser({ email, full_name: fullName, password })
      toast.success('Usuario creado correctamente')
      setUsers(prev => [newUser, ...prev])
      handleCloseModal()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al crear usuario')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
        <h2 className="text-base sm:text-lg font-semibold font-display text-ink">Gestión de usuarios</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 text-sm font-medium bg-[#166534] text-white px-4 py-2 rounded-lg hover:bg-[#14532d] transition-colors"
        >
          <UserPlus size={15} />
          <span className="hidden sm:inline">Nuevo usuario</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="w-full overflow-auto">
          <table className="w-full min-w-max text-sm border-collapse">
            <thead className="bg-surface-muted">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-border">Nombre completo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-border">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-border">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-border">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-3"><div className="h-4 bg-surface-muted rounded animate-pulse w-32" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-surface-muted rounded animate-pulse w-48" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-surface-muted rounded animate-pulse w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-surface-muted rounded animate-pulse w-16" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr className="border-b border-border">
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">No hay usuarios registrados.</td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="border-b border-border hover:bg-surface-muted transition-colors">
                    <td className="px-4 py-3 text-ink">{u.full_name}</td>
                    <td className="px-4 py-3 text-ink">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${ROL_CLASSES[u.role] ?? 'bg-surface-muted text-ink-muted'}`}>
                        {ROL_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.is_active ? (
                        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-brand-light text-brand-dark">Activo</span>
                      ) : (
                        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">Inactivo</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Editar"
                          className="p-1.5 rounded-md text-ink-muted hover:text-[#166534] hover:bg-brand-light transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
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

      {modalOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={handleCloseModal} />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="pointer-events-auto bg-surface-card rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <CircleUserRound size={20} className="text-[#166534]" />
                  <h3 className="text-base font-semibold font-display text-ink">Nuevo usuario</h3>
                </div>
                <button onClick={handleCloseModal} className="text-ink-muted hover:text-ink transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-ink-muted">Nombre completo</label>
                  <input
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-ink bg-surface outline-none focus:border-[#166534] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-ink-muted">Correo electrónico</label>
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-ink bg-surface outline-none focus:border-[#166534] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-ink-muted">Contraseña</label>
                  <input
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-ink bg-surface outline-none focus:border-[#166534] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-ink-muted">Rol</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as 'admin' | 'researcher' | 'viewer')}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-ink bg-surface outline-none focus:border-[#166534] transition-colors cursor-pointer"
                  >
                    <option value="admin">Administrador</option>
                    <option value="researcher">Colaborador</option>
                    <option value="viewer">Visitante</option>
                  </select>
                  <p className="text-xs text-ink-muted mt-0.5 px-1">{ROL_DESC[role]}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={handleCloseModal}
                  className="text-sm text-ink-muted hover:text-ink transition-colors px-4 py-2"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="text-sm font-medium bg-[#166534] text-white px-4 py-2 rounded-lg hover:bg-[#14532d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creando…' : 'Crear usuario'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {editTarget && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={handleCloseEdit} />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="pointer-events-auto bg-surface-card rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <CircleUserRound size={20} className="text-[#166534]" />
                  <h3 className="text-base font-semibold font-display text-ink">Editar usuario</h3>
                </div>
                <button onClick={handleCloseEdit} className="text-ink-muted hover:text-ink transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-ink-muted">Nombre completo</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={e => setEditFullName(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-ink bg-surface outline-none focus:border-[#166534] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-ink-muted">Rol</label>
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value as 'admin' | 'researcher' | 'viewer')}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-ink bg-surface outline-none focus:border-[#166534] transition-colors cursor-pointer"
                  >
                    <option value="admin">Administrador</option>
                    <option value="researcher">Colaborador</option>
                    <option value="viewer">Visitante</option>
                  </select>
                  <p className="text-xs text-ink-muted mt-0.5 px-1">{ROL_DESC[editRole]}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={handleCloseEdit}
                  className="text-sm text-ink-muted hover:text-ink transition-colors px-4 py-2"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="text-sm font-medium bg-[#166534] text-white px-4 py-2 rounded-lg hover:bg-[#14532d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmarEliminar
        open={!!deleteTarget}
        titulo="Eliminar usuario"
        descripcion={
          deleteTarget
            ? <>¿Eliminar a <span className="font-medium text-ink">{deleteTarget.full_name}</span>? Esta acción no se puede deshacer.</>
            : null
        }
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}