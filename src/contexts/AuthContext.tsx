import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface User {
  id: string
  email: string
  nome: string
  role: 'admin' | 'editor' | 'viewer'
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (creds: any) => Promise<boolean>
  logout: () => void
  verifyProductionPassword: () => Promise<any>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const ADMIN_USER: User = {
  id: 'admin-dev',
  email: 'admin@autnew.com',
  nome: 'Administrador',
  role: 'admin'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  
  useEffect(() => {
    // Forçar login imediato no carregamento
    localStorage.setItem('autnew:token', 'DEV_BYPASS_TOKEN')
    setUser(ADMIN_USER)
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: true,
      isLoading: false,
      isAdmin: true,
      login: async () => true,
      logout: () => {},
      verifyProductionPassword: async () => ({ success: true }),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)!
}

export function useAuthToken() {
  return 'DEV_BYPASS_TOKEN';
}
