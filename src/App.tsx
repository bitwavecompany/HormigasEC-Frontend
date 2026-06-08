import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './providers/AuthProvider'
import { useAuth } from './hooks/useAuth'
import AppLayout from './layouts/AppLayout'
import MapaModule from './modules/mapa/MapaModule'
import UsuariosModule from './modules/usuarios/UsuariosModule'
import ArchivosModule from './modules/archivos/ArchivosModule'
import HistorialModule from './modules/historial/HistorialModule'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-center" />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPageGuard />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<AppLayout />}>
              <Route element={<ProtectedRoute roles={['admin', 'researcher', 'viewer']} />}>
                <Route path="mapa" element={<MapaModule />} />
              </Route>
              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="usuarios" element={<UsuariosModule />} />
              </Route>
              <Route element={<ProtectedRoute roles={['admin', 'researcher']} />}>
                <Route path="archivos" element={<ArchivosModule />} />
              </Route>
              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="historial" element={<HistorialModule />} />
              </Route>
              <Route index element={<Navigate to="mapa" replace />} />
            </Route>
          </Route>

          <Route path="/" element={<AuthRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

function AuthRedirect() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  return <Navigate to={isAuthenticated ? '/app/mapa' : '/login'} replace />
}

function LoginPageGuard() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  if (isAuthenticated) return <Navigate to="/app/mapa" replace />
  return <LoginPage />
}