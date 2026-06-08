import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Map, Users, FolderOpen, Menu, LogOut, CircleUserRound, X, ClipboardList } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import SidebarFieldCanvas from '../components/SidebarFieldCanvas'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  researcher: 'Colaborador',
  viewer: 'Visitante',
}

type Role = 'admin' | 'researcher' | 'viewer'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  roles: Role[]
}

const NAV_ITEMS: NavItem[] = [
  { to: '/app/mapa', icon: Map, label: 'Mapa', roles: ['admin', 'researcher', 'viewer'] },
  { to: '/app/usuarios', icon: Users, label: 'Usuarios', roles: ['admin'] },
  { to: '/app/archivos', icon: FolderOpen, label: 'Archivos', roles: ['admin', 'researcher'] },
  { to: '/app/historial', icon: ClipboardList, label: 'Historial', roles: ['admin'] },
]

const SIDEBAR_INTERACTIVE_ZONES: Array<{ yStart: number; yEnd: number }> = [
  { yStart: 0, yEnd: 80 },
  { yStart: 80, yEnd: 280 },
  { yStart: 700, yEnd: 900 },
]

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [profileOpen, setProfileOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const navVisibles = NAV_ITEMS.filter(item =>
    user ? item.roles.includes(user.role) : false
  )

  return (
    <div className="h-screen flex overflow-hidden bg-surface">
      {!isMobile && (
      <aside
        style={{
          background: '#166534',
          width: sidebarOpen ? '240px' : '64px',
          transition: 'width 200ms ease',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="flex-shrink-0 flex flex-col"
      >
        <SidebarFieldCanvas interactiveZones={SIDEBAR_INTERACTIVE_ZONES} fixedWidth={240} />
        <div style={{ position: 'relative', zIndex: 10 }} className="flex flex-col flex-1">
        <div
          className={`flex items-center gap-3 py-5 ${
            sidebarOpen ? 'px-4 justify-between' : 'justify-center px-2'
          }`}
        >
          {sidebarOpen && (
            <span className="text-white font-bold text-base tracking-wide">
              Hormigas <span style={{ color: 'rgba(255,255,255,0.65)' }}>EC</span>
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="text-white/70 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 px-2 py-2 flex flex-col gap-1">
          {navVisibles.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
            >
              {({ isActive }) => (
                <span
                  className={`flex items-center rounded-xl text-sm font-medium transition-colors cursor-pointer select-none ${
                    sidebarOpen ? 'gap-3 px-3 py-2.5' : 'justify-center py-3'
                  } ${
                    isActive
                      ? 'text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  style={
                    isActive
                      ? { background: 'rgba(255,255,255,0.13)' }
                      : undefined
                  }
                >
                  <Icon size={20} />
                  {sidebarOpen && (
                    <span className="flex-1">{label}</span>
                  )}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div
          className={`pb-4 pt-3 flex flex-col gap-2 ${
            sidebarOpen ? 'px-3' : 'px-2 items-center'
          }`}
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className={`flex items-center gap-2 ${sidebarOpen ? 'px-1 mb-1' : ''}`}>
            <CircleUserRound size={28} className="text-white/80 flex-shrink-0" />
            {sidebarOpen && (
              <span
                className="text-xs font-bold truncate"
                style={{ color: 'rgba(255,255,255,0.9)' }}
              >
                {user?.email}
              </span>
            )}
          </div>

          {sidebarOpen ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 font-bold text-white text-sm transition-all duration-200 ease-in-out active:scale-95 cursor-pointer"
              style={{ padding: '10px', borderRadius: '23px', border: 'none', background: '#dc2626' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#b91c1c')}
              onMouseLeave={e => (e.currentTarget.style.background = '#dc2626')}
            >
              <LogOut size={15} />
              Cerrar sesion
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center justify-center transition-colors p-2 rounded-md"
              style={{ color: '#fca5a5' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={e => (e.currentTarget.style.color = '#fca5a5')}
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
        </div>
      </aside>
      )}

      <main className={`flex-1 overflow-hidden relative ${isMobile ? 'pb-[60px]' : ''}`}>
        <Outlet />
      </main>

      {isMobile && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
          style={{ background: '#166534', height: '60px' }}
        >
          {navVisibles.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className="flex-1">
              {({ isActive }) => (
                <div
                  className={`flex flex-col items-center justify-center gap-0.5 h-full ${
                    isActive ? 'text-white' : 'text-white/60'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs font-medium">{label}</span>
                </div>
              )}
            </NavLink>
          ))}
          <button
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full ${
              profileOpen ? 'text-white' : 'text-white/60'
            }`}
            onClick={() => setProfileOpen(true)}
          >
            <CircleUserRound size={20} />
            <span className="text-xs font-medium">Perfil</span>
          </button>
        </nav>
      )}

      {isMobile && profileOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/40"
            onClick={() => setProfileOpen(false)}
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 pointer-events-none">
            <div className="pointer-events-auto bg-surface-card rounded-2xl shadow-2xl p-6 w-full max-w-xs">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold font-display text-ink">Mi perfil</h3>
                <button
                  onClick={() => setProfileOpen(false)}
                  className="text-ink-muted hover:text-ink transition-colors p-1 rounded-md"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col items-center gap-3 mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: '#166534' }}
                >
                  <CircleUserRound size={36} className="text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-ink">{user?.email}</p>
                  <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-brand-light text-brand-dark capitalize">
                    {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 font-bold text-white text-sm transition-all duration-200 ease-in-out active:scale-95 cursor-pointer"
                style={{ padding: '10px', borderRadius: '23px', border: 'none', background: '#dc2626' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#b91c1c')}
                onMouseLeave={e => (e.currentTarget.style.background = '#dc2626')}
              >
                <LogOut size={15} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}