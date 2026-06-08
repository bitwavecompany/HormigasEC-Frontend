import { useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'
import { login as loginService } from '../api/auth'
import { getMe } from '../api/users'
import { AuthContext } from '../context/AuthContext'
import type { AuthContextValue, Usuario } from '../context/AuthContext'

const TOKEN_KEY = 'hormigas_token'

interface JwtPayload {
  sub: string
  email: string
  role: 'admin' | 'researcher' | 'viewer'
  exp: number
}

function getTokenFromStorage(): string | null {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  try {
    const payload = jwtDecode<JwtPayload>(token)
    const ahora = Math.floor(Date.now() / 1000)
    if (payload.exp < ahora) {
      localStorage.removeItem(TOKEN_KEY)
      return null
    }
    return token
  } catch {
    localStorage.removeItem(TOKEN_KEY)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getTokenFromStorage)
  const [user, setUser] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(() => !!getTokenFromStorage())

  useEffect(() => {
    const storedToken = getTokenFromStorage()
    if (!storedToken) return

    getMe()
      .then(perfil => {
        setUser({
          id: String(perfil.id),
          email: perfil.email,
          full_name: perfil.full_name,
          role: perfil.role,
          is_active: perfil.is_active,
        })
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginService({ email, password })
    localStorage.setItem(TOKEN_KEY, response.access_token)
    setToken(response.access_token)
    const perfil = await getMe()
    setUser({
      id: String(perfil.id),
      email: perfil.email,
      full_name: perfil.full_name,
      role: perfil.role,
      is_active: perfil.is_active,
    })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}