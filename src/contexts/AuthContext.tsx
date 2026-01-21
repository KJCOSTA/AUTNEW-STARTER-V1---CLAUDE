import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface User {
  id: string
  email: string
  nome: string
  role: 'admin' | 'user'
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: () => Promise<void>
  logout: () => void
  changePassword: () => Promise<void>
  verifyProductionPassword: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | null>(null)

const DEV_USER: User = {
  id: 'admin-dev',
  email: 'admin@autnew.com',
  nome: 'Administrador',
  role: 'admin',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // LOGIN AUTOMÁTICO CANÔNICO
    setUser(DEV_USER)
    setIsLoading(false)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login: async () => setUser(DEV_USER),
        logout: () => setUser(null),
        changePassword: async () => {},
        verifyProductionPassword: async () => true,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('AuthContext not found')
  return ctx
}
