import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Layout } from './components/layout/Layout'
import { ToastContainer } from './components/ui/Toast'
import { Loading } from './components/ui/Loading'
import { PlanRun, Diretrizes, Monitor, Historico, Configuracoes, GestaoUsuarios } from './components/modules'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginPage } from './components/auth/LoginPage'
import { ChangePasswordPage } from './components/auth/ChangePasswordPage'
import { SystemCheck } from './components/system/SystemCheck'
import { useStore } from './store/useStore'
import { Loader2 } from 'lucide-react'

function AppContent() {
  const [activeModule, setActiveModule] = useState('plan-run')
  
  // Lógica de Memória: Lê se o check já foi feito na sessão
  const [systemCheckPassed, setSystemCheckPassed] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('autnew_check_ok') === 'true'
    }
    return false
  })
  
  const { loading, loadingMessage } = useStore()
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth()

  const handleCheckComplete = () => {
    sessionStorage.setItem('autnew_check_ok', 'true')
    setSystemCheckPassed(true)
  }

  // 1. Carregando Login...
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600"/>
      </div>
    )
  }

  // 2. LOGADO? Entra direto (Fura o bloqueio do Check)
  if (isAuthenticated) {
    if (user?.primeiroAcesso) return <ChangePasswordPage />
    
    return (
      <>
        <Layout activeModule={activeModule as any} onModuleChange={(m: any) => setActiveModule(m)}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeModule === 'plan-run' && <PlanRun />}
              {activeModule === 'diretrizes' && <Diretrizes />}
              {activeModule === 'monitor' && <Monitor />}
              {activeModule === 'historico' && <Historico />}
              {activeModule === 'configuracoes' && <Configuracoes />}
              {activeModule === 'usuarios' && (isAdmin ? <GestaoUsuarios /> : <PlanRun />)}
            </motion.div>
          </AnimatePresence>
        </Layout>
        <ToastContainer />
        <SpeedInsights />
        <AnimatePresence>{loading && <Loading fullScreen message={loadingMessage} />}</AnimatePresence>
      </>
    )
  }

  // 3. NÃO LOGADO? Precisa passar pelo Check primeiro
  if (!systemCheckPassed) {
    return <SystemCheck onComplete={handleCheckComplete} />
  }

  // 4. CHECK OK, MAS NÃO LOGADO? Tela de Login
  return <LoginPage />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
