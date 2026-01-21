import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface User {
  id: string
  email: string
  nome: string
  role: 'admin' | 'editor' | 'viewer'
  primeiroAcesso?: boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  verifyProductionPassword: (password: string) => Promise<{ success: boolean; error?: string }>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'autnew:token'
const USER_KEY = 'autnew:user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Verify existing token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem(TOKEN_KEY)
      const storedUser = localStorage.getItem(USER_KEY)

      console.log('[AUTH] Verifying token on mount...', { hasToken: !!token, hasUser: !!storedUser })

      if (!token || !storedUser) {
        console.log('[AUTH] No token or user found, skipping verification')
        setIsLoading(false)
        return
      }

      try {
        console.log('[AUTH] Sending token verification request...')
        // Verify token with backend
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ action: 'session' })
        })

        console.log('[AUTH] Token verification response:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('[AUTH] Token verification result:', { success: data.success, hasUser: !!data.user })

          if (data.success && data.user) {
            console.log('[AUTH] Token valid, setting user:', data.user.email)
            setUser(data.user)
          } else {
            // Token invalid, clear storage
            console.log('[AUTH] Token invalid (no user in response), clearing storage')
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(USER_KEY)
          }
        } else {
          // Token invalid, clear storage
          console.log('[AUTH] Token invalid (non-OK response), clearing storage')
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(USER_KEY)
        }
      } catch (error) {
        console.error('[AUTH] Token verification failed with error:', error)
        // On network error, don't clear token - just try to use cached user
        try {
          const cachedUser = JSON.parse(storedUser)
          console.log('[AUTH] Using cached user due to network error:', cachedUser.email)
          setUser(cachedUser)
        } catch (parseError) {
          console.error('[AUTH] Failed to parse cached user, clearing storage')
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(USER_KEY)
        }
      } finally {
        console.log('[AUTH] Token verification complete, setting isLoading to false')
        setIsLoading(false)
      }
    }

    verifyToken()
  }, [])

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'login',
          email: credentials.email,
          senha: credentials.password
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Save token and user
        localStorage.setItem(TOKEN_KEY, data.token)
        localStorage.setItem(USER_KEY, JSON.stringify(data.user))
        setUser(data.user)

        console.log('[AUTH] Login successful:', data.user.email)
        return { success: true }
      } else {
        console.error('[AUTH] Login failed:', data.error)
        return { success: false, error: data.error || 'Credenciais inválidas' }
      }
    } catch (error) {
      console.error('[AUTH] Login error:', error)
      return { success: false, error: 'Erro ao conectar com o servidor' }
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY)

      if (token) {
        // Call backend to invalidate session
        await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ action: 'logout' })
        })
      }
    } catch (error) {
      console.error('[AUTH] Logout error:', error)
    } finally {
      // Clear local storage regardless
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      setUser(null)
      console.log('[AUTH] Logout successful')
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY)

      if (!token) {
        return { success: false, error: 'Não autenticado' }
      }

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'change-password',
          senhaAtual: currentPassword,
          novaSenha: newPassword
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Update user to mark first access as complete
        if (user) {
          const updatedUser = { ...user, primeiroAcesso: false }
          setUser(updatedUser)
          localStorage.setItem(USER_KEY, JSON.stringify(updatedUser))
        }

        console.log('[AUTH] Password changed successfully')
        return { success: true }
      } else {
        console.error('[AUTH] Password change failed:', data.error)
        return { success: false, error: data.error || 'Erro ao alterar senha' }
      }
    } catch (error) {
      console.error('[AUTH] Password change error:', error)
      return { success: false, error: 'Erro ao conectar com o servidor' }
    }
  }

  const verifyProductionPassword = async (password: string) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY)

      if (!token) {
        return { success: false, error: 'Não autenticado' }
      }

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'verify-production',
          senha: password
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        console.log('[AUTH] Production password verified')
        return { success: true }
      } else {
        console.error('[AUTH] Production password verification failed:', data.error)
        return { success: false, error: data.error || 'Senha incorreta' }
      }
    } catch (error) {
      console.error('[AUTH] Production password verification error:', error)
      return { success: false, error: 'Erro ao conectar com o servidor' }
    }
  }

  const isAdmin = user?.role === 'admin'
  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      isAdmin,
      login,
      logout,
      changePassword,
      verifyProductionPassword,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function useAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}
