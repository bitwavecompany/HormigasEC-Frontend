import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  roles?: Array<'admin' | 'researcher' | 'viewer'>
}

export default function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/app/mapa" replace />
  }

  return <Outlet />
}