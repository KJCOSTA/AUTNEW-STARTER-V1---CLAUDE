import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import type { User, LoginCredentials } from '../types'

/**
 * AUTH CONTEXT — STABLE DEV MODE (COMPATÍVEL)
 * - Mantém TODOS os métodos esperados pelo app
 * - Não chama backend
 * - Compila 100%
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
  changePassword: (senhaAtual: string, novaSenha: string) => Promise<AuthResult>
  verifyProductionPassword: (senha: string) => Promise<AuthResult>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(BYPASS_AUTH ? BYPASS_USER : null)
  const [isLoading] = useState(false)

  const isAuthenticated = !!user
  const isAdmin = user?.role === 'admin'

  const login = useCallback(async (_: LoginCredentials): Promise<AuthResult> => {
    setUser(BYPASS_USER)
    return { success: true }
  }, [])

  const logout = useCallback(async () => {
    setUser(BYPASS_USER)
  }, [])

  const changePassword = useCallback(async (): Promise<AuthResult> => {
    // Stub DEV — sempre sucesso
    return { success: true }
  }, [])

  const verifyProductionPassword = useCallback(async (): Promise<AuthResult> => {
    // Stub DEV — sempre sucesso
    return { success: true }
  }, [])

  useEffect(() => {
    setUser(BYPASS_USER)
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
        changePassword,
        verifyProductionPassword,
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

/**
 * Compatibilidade com código legado
 */
export function useAuthToken(): string | null {
  return 'DEV_BYPASS_TOKEN'
}
