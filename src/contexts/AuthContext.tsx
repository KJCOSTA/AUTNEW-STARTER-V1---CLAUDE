import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import type { User, LoginCredentials } from '../types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isAdmin: boolean
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  changePassword: (senhaAtual: string, novaSenha: string) => Promise<{ success: boolean; error?: string }>
  verifyProductionPassword: (senha: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'autnew_auth_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user
  const isAdmin = user?.role === 'admin'

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
    const token = getToken()
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth', {
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
  const login = useCallback(async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth', {
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
        return { success: false, error: data.error || 'Erro ao fazer login' }
      }
    } catch (error) {
      console.error('Login failed:', error)
      return { success: false, error: 'Erro de conexão. Tente novamente.' }
    }
  }, [saveToken])

  // Logout
  const logout = useCallback(async () => {
    const token = getToken()

    try {
      await fetch('/api/auth', {
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
  const changePassword = useCallback(async (senhaAtual: string, novaSenha: string): Promise<{ success: boolean; error?: string }> => {
    const token = getToken()

    try {
      const response = await fetch('/api/auth', {
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
        return { success: false, error: data.error || 'Erro ao trocar senha' }
      }
    } catch (error) {
      console.error('Change password failed:', error)
      return { success: false, error: 'Erro de conexão. Tente novamente.' }
    }
  }, [getToken, user])

  // Verify password for production mode
  const verifyProductionPassword = useCallback(async (senha: string): Promise<{ success: boolean; error?: string }> => {
    const token = getToken()

    try {
      const response = await fetch('/api/auth', {
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
        return { success: false, error: data.error || 'Senha incorreta' }
      }
    } catch (error) {
      console.error('Verify production password failed:', error)
      return { success: false, error: 'Erro de conexão. Tente novamente.' }
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
