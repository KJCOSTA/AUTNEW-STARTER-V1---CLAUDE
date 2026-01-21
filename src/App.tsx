import { useState, Component, ErrorInfo, ReactNode } from 'react'
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
import { Loader2, AlertTriangle } from 'lucide-react'

// Error Boundary para capturar "Tela Preta"
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: string }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: '' }
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error.toString() }
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-red-500 flex flex-col items-center justify-center p-8">
          <AlertTriangle className="w-16 h-16 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Algo deu errado (Crash)</h1>
          <pre className="bg-zinc-900 p-4 rounded text-xs max-w-2xl overflow-auto border border-red-900">
            {this.state.error}
          </pre>
          <button onClick={() => window.location.reload()} className="mt-8 px-6 py-2 bg-white text-black font-bold rounded">
            Recarregar Página
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function AppContent() {
  const [activeModule, setActiveModule] = useState('plan-run')
  const [systemCheckPassed, setSystemCheckPassed] = useState(false)
  const { loading, loadingMessage } = useStore()
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth()

  // 1. Diagnóstico Inicial
  if (!systemCheckPassed) {
    return <SystemCheck onComplete={() => setSystemCheckPassed(true)} />
  }

  // 2. Loading Auth
  if (isLoading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-500"/></div>
  }

  // 3. Login
  if (!isAuthenticated) {
    return <LoginPage />
  }

  // 4. Change Pass
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
    <ErrorBoundary>
      <Layout activeModule={activeModule as any} onModuleChange={(m: any) => setActiveModule(m)}>
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
    </ErrorBoundary>
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
