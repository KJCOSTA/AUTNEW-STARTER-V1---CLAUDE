import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import type { User, LoginCredentials } from '../types'

// ============================================
// AUTENTICAÇÃO COM POSTGRESQL
// Banco de dados real está funcionando
// ============================================
const BYPASS_AUTH = true

const BYPASS_USER: User = {
  id: 'bypass-admin-001',
  email: 'kleiton@autnew.com',
  nome: 'Kleiton (Dev Mode)',
  role: 'admin',
  ativo: true,
  criadoEm: new Date().toISOString(),
  primeiroAcesso: false,
}

interface AuthResult {
  success: boolean
  error?: string
  errorCode?: string
  errorDetails?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isAdmin: boolean
  login: (credentials: LoginCredentials) => Promise<AuthResult>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  changePassword: (senhaAtual: string, novaSenha: string) => Promise<AuthResult>
  verifyProductionPassword: (senha: string) => Promise<AuthResult>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'autnew_auth_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  // Se BYPASS_AUTH está ativo, já inicia logado
  const [user, setUser] = useState<User | null>(BYPASS_AUTH ? BYPASS_USER : null)
  const [isLoading, setIsLoading] = useState(!BYPASS_AUTH)

  const isAuthenticated = !!user
  const isAdmin = user?.role === 'admin'

  // Se bypass está ativo, mostra no console
  useEffect(() => {
    if (BYPASS_AUTH) {
      console.log('🔓 BYPASS DE AUTH ATIVO - Logado automaticamente como admin')
      console.log('📝 Para desativar, mude BYPASS_AUTH para false em AuthContext.tsx')
    }
  }, [])

  // Get token from localStorage
  const getToken = useCallback(() => {
    return localStorage.getItem(TOKEN_KEY)
  }, [])

  // Save token to localStorage
  const saveToken = useCallback((token: string) => {
    localStorage.setItem(TOKEN_KEY, token)
  }, [])

  // Remove token from localStorage
  const removeToken = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
  }, [])

  // Check session on mount
  const checkSession = useCallback(async () => {
    // Bypass: já está logado, não precisa verificar
    if (BYPASS_AUTH) {
      setUser(BYPASS_USER)
      setIsLoading(false)
      return
    }

    const token = getToken()
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const response = await // fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'session' }),
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        removeToken()
        setUser(null)
      }
    } catch (error) {
      console.error('Session check failed:', error)
      removeToken()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [getToken, removeToken])

  // Login
  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResult> => {
    // Bypass: login instantâneo
    if (BYPASS_AUTH) {
      console.log('🔓 BYPASS: Login automático para', credentials.email)
      setUser(BYPASS_USER)
      saveToken('bypass-token-dev')
      return { success: true }
    }

    try {
      const response = await // fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', ...credentials }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        saveToken(data.token)
        setUser(data.user)
        return { success: true }
      } else {
        // Handle specific error codes with more details
        const errorCode = data.code || `HTTP_${response.status}`
        const errorDetails = data.details || data.hint || undefined

        if (data.code === 'DATABASE_CONNECTION_ERROR') {
          return {
            success: false,
            error: 'Erro de conexão com o banco de dados.',
            errorCode,
            errorDetails: errorDetails || 'Verifique a configuração do POSTGRES_URL no Vercel.'
          }
        }
        return {
          success: false,
          error: data.error || 'Erro ao fazer login',
          errorCode,
          errorDetails
        }
      }
    } catch (error) {
      console.error('Login failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Erro de rede. Verifique sua conexão.',
          errorCode: 'NETWORK_ERROR',
          errorDetails: errorMessage
        }
      }
      return {
        success: false,
        error: 'Erro de conexão. Tente novamente.',
        errorCode: 'CONNECTION_ERROR',
        errorDetails: errorMessage
      }
    }
  }, [saveToken])

  // Logout
  const logout = useCallback(async () => {
    // Bypass: logout instantâneo (mas reloga automaticamente)
    if (BYPASS_AUTH) {
      console.log('🔓 BYPASS: Logout... mas você continua logado em modo dev')
      // Em bypass, não desloga de verdade - apenas recarrega o usuário
      setUser(BYPASS_USER)
      return
    }

    const token = getToken()

    try {
      await // fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'logout' }),
      })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      removeToken()
      setUser(null)
    }
  }, [getToken, removeToken])

  // Change password
  const changePassword = useCallback(async (senhaAtual: string, novaSenha: string): Promise<AuthResult> => {
    // Bypass: aceita qualquer troca de senha
    if (BYPASS_AUTH) {
      console.log('🔓 BYPASS: Troca de senha aprovada automaticamente')
      return { success: true }
    }

    const token = getToken()

    try {
      const response = await // fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'change-password', senhaAtual, novaSenha }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Update user to reflect primeiroAcesso = false
        if (user) {
          setUser({ ...user, primeiroAcesso: false })
        }
        return { success: true }
      } else {
        return {
          success: false,
          error: data.error || 'Erro ao trocar senha',
          errorCode: data.code || `HTTP_${response.status}`,
          errorDetails: data.details
        }
      }
    } catch (error) {
      console.error('Change password failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      return {
        success: false,
        error: 'Erro de conexão. Tente novamente.',
        errorCode: 'CONNECTION_ERROR',
        errorDetails: errorMessage
      }
    }
  }, [getToken, user])

  // Verify password for production mode
  const verifyProductionPassword = useCallback(async (senha: string): Promise<AuthResult> => {
    // Bypass: aceita qualquer senha
    if (BYPASS_AUTH) {
      console.log('🔓 BYPASS: Verificação de senha do modo produção aprovada automaticamente')
      return { success: true }
    }

    const token = getToken()

    try {
      const response = await // fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'verify-production', senha }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        return { success: true }
      } else {
        return {
          success: false,
          error: data.error || 'Senha incorreta',
          errorCode: data.code || `HTTP_${response.status}`,
          errorDetails: data.details
        }
      }
    } catch (error) {
      console.error('Verify production password failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      return {
        success: false,
        error: 'Erro de conexão. Tente novamente.',
        errorCode: 'CONNECTION_ERROR',
        errorDetails: errorMessage
      }
    }
  }, [getToken])

  // Check session on mount
  useEffect(() => {
    checkSession()
  }, [checkSession])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isAdmin,
        login,
        logout,
        checkSession,
        changePassword,
        verifyProductionPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for getting auth token (for API calls)
export function useAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
