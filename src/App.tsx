import { useState, Component, ErrorInfo, ReactNode, useEffect } from 'react'
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

// Error Boundary para evitar tela branca da morte
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: string }> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: '' } }
  static getDerivedStateFromError(error: any) { return { hasError: true, error: error.toString() } }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-red-500 flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="w-16 h-16 mb-4 mx-auto" />
          <h1 className="text-2xl font-bold mb-2">Erro Crítico de Renderização</h1>
          <p className="text-zinc-400 mb-4">O sistema encontrou um erro inesperado.</p>
          <button onClick={() => { sessionStorage.clear(); window.location.reload() }} className="px-6 py-2 bg-white text-black font-bold rounded hover:bg-zinc-200">
            Limpar Cache e Recarregar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function AppContent() {
  const [activeModule, setActiveModule] = useState('plan-run')
  // FIX: Lê do sessionStorage se já passou pelo check para não travar no reload
  const [systemCheckPassed, setSystemCheckPassed] = useState(() => {
    return sessionStorage.getItem('autnew_sys_check') === 'true'
  })
  
  const { loading, loadingMessage } = useStore()
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth()

  // Salva estado quando passa
  const handleCheckComplete = () => {
    sessionStorage.setItem('autnew_sys_check', 'true')
    setSystemCheckPassed(true)
  }

  // 1. Loading Inicial da Auth
  if (isLoading) {
    return <div className="min-h-screen bg-[#030712] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600"/></div>
  }

  // 2. Se já estiver logado, PULA o System Check (Prioridade Máxima)
  if (isAuthenticated) {
    // Renderiza o Sistema Principal
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

  // 3. Se não está logado E não passou no check, mostra check
  if (!systemCheckPassed) {
    return <SystemCheck onComplete={handleCheckComplete} />
  }

  // 4. Se passou no check mas não tá logado, mostra Login
  return <LoginPage />
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
