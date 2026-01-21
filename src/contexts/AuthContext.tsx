import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import type { User, LoginCredentials } from '../types'

/**
 * ===============================
 * AUTH CONTEXT — STABLE DEV MODE
 * ===============================
 * - Compila
 * - Não chama backend
 * - Não entra em loop
 * - Reversível depois
 */

const BYPASS_AUTH = true

const BYPASS_USER: User = {
  id: 'admin-dev',
  email: 'admin@autnew.com',
  nome: 'Admin (Dev)',
  role: 'admin',
  ativo: true,
  criadoEm: new Date().toISOString(),
  primeiroAcesso: false,
}

interface AuthResult {
  success: boolean
  error?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isAdmin: boolean
  login: (credentials: LoginCredentials) => Promise<AuthResult>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(BYPASS_AUTH ? BYPASS_USER : null)
  const [isLoading, setIsLoading] = useState(false)

  const isAuthenticated = !!user
  const isAdmin = user?.role === 'admin'

  const login = useCallback(async (_: LoginCredentials): Promise<AuthResult> => {
    if (BYPASS_AUTH) {
      setUser(BYPASS_USER)
      return { success: true }
    }
    return { success: false, error: 'Auth disabled' }
  }, [])

  const logout = useCallback(async () => {
    if (BYPASS_AUTH) {
      setUser(BYPASS_USER)
    }
  }, [])

  useEffect(() => {
    if (BYPASS_AUTH) {
      setUser(BYPASS_USER)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isAdmin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
