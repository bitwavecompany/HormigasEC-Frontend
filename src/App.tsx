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

export default function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-center" />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPageGuard />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<AppLayout />}>
              <Route path="mapa" element={<MapaModule />} />
              <Route path="usuarios" element={<UsuariosModule />} />
              <Route path="archivos" element={<ArchivosModule />} />
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
