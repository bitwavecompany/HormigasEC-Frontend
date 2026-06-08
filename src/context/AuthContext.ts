import { createContext } from 'react'

export interface Usuario {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'researcher' | 'viewer'
  is_active: boolean
}

export interface AuthContextValue {
  user: Usuario | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)