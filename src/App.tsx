import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Layout } from './components/layout/Layout'
import { ToastContainer } from './components/ui/Toast'
import { Loading } from './components/ui/Loading'
import {
  PlanRun,
  Diretrizes,
  Monitor,
  Historico,
  Configuracoes,
  GestaoUsuarios,
} from './components/modules'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginPage } from './components/auth/LoginPage'
import { ChangePasswordPage } from './components/auth/ChangePasswordPage'
import { SystemCheck } from './components/system/SystemCheck'
import { useStore } from './store/useStore'
import type { ModuleName } from './types'
import { Loader2 } from 'lucide-react'

function AppContent() {
  const [activeModule, setActiveModule] = useState<ModuleName>('plan-run')
  const [systemCheckPassed, setSystemCheckPassed] = useState(false)
  const { loading, loadingMessage } = useStore()
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth()

  // 1. CHECAGEM DE SISTEMA (Obrigatória no início)
  if (!systemCheckPassed) {
    return <SystemCheck onComplete={() => setSystemCheckPassed(true)} />
  }

  // 2. LOADING DE AUTENTICAÇÃO
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-purple" />
      </div>
    )
  }

  // 3. LOGIN
  if (!isAuthenticated) {
    return <LoginPage />
  }

  // 4. CHANGE PASSWORD
  if (user?.primeiroAcesso) {
    return <ChangePasswordPage />
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'plan-run': return <PlanRun />
      case 'diretrizes': return <Diretrizes />
      case 'monitor': return <Monitor />
      case 'historico': return <Historico />
      case 'configuracoes': return <Configuracoes />
      case 'usuarios': return isAdmin ? <GestaoUsuarios /> : <PlanRun />
      default: return <PlanRun />
    }
  }

  return (
    <>
      <Layout activeModule={activeModule} onModuleChange={setActiveModule}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderModule()}
          </motion.div>
        </AnimatePresence>
      </Layout>
      <ToastContainer />
      <SpeedInsights />
      <AnimatePresence>
        {loading && <Loading fullScreen message={loadingMessage} />}
      </AnimatePresence>
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
