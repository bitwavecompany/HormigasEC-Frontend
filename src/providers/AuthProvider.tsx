import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'
import { login as loginService } from '../api/auth'
import { AuthContext } from '../context/AuthContext'
import type { AuthContextValue, Usuario } from '../context/AuthContext'

const TOKEN_KEY = 'hormigas_token'

interface JwtPayload {
  sub: string
  email: string
  role: 'admin' | 'researcher' | 'viewer'
  exp: number
}

function decodeUsuario(token: string): Usuario | null {
  try {
    const payload = jwtDecode<JwtPayload>(token)
    const ahora = Math.floor(Date.now() / 1000)
    if (payload.exp < ahora) return null
    return { id: payload.sub, email: payload.email, role: payload.role }
  } catch {
    console.error('Error al decodificar token')
    return null
  }
}

function initToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  const usuario = decodeUsuario(token)
  if (!usuario) {
    localStorage.removeItem(TOKEN_KEY)
    return null
  }
  return token
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(initToken)
  const [user, setUser] = useState<Usuario | null>(() => {
    const t = localStorage.getItem(TOKEN_KEY)
    return t ? decodeUsuario(t) : null
  })

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginService({ email, password })
    const usuario = decodeUsuario(response.access_token)
    if (!usuario) throw new Error('Token inválido recibido del servidor')
    localStorage.setItem(TOKEN_KEY, response.access_token)
    setToken(response.access_token)
    setUser(usuario)
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
    isLoading: false,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}