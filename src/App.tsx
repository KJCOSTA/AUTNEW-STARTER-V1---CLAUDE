import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
import { useStore } from './store/useStore'
import type { ModuleName } from './types'
import { Loader2 } from 'lucide-react'

function AppContent() {
  const [activeModule, setActiveModule] = useState<ModuleName>('plan-run')
  const { loading, loadingMessage } = useStore()
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth()

  // TEMPORARY: Check for bypass mode via URL parameter
  const urlParams = new URLSearchParams(window.location.search)
  const bypassAuth = urlParams.get('bypass') === 'true'

  // Show loading while checking auth (skip if bypass mode)
  if (isLoading && !bypassAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-purple" />
      </div>
    )
  }

  // Show login if not authenticated (skip if bypass mode)
  if (!isAuthenticated && !bypassAuth) {
    return <LoginPage />
  }

  // Show change password if first access (skip if bypass mode)
  if (user?.primeiroAcesso && !bypassAuth) {
    return <ChangePasswordPage />
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'plan-run':
        return <PlanRun />
      case 'diretrizes':
        return <Diretrizes />
      case 'monitor':
        return <Monitor />
      case 'historico':
        return <Historico />
      case 'configuracoes':
        return <Configuracoes />
      case 'usuarios':
        // Only admin can access user management (bypass mode grants admin)
        return (isAdmin || bypassAuth) ? <GestaoUsuarios /> : <PlanRun />
      default:
        return <PlanRun />
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

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Global Loading Overlay */}
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
