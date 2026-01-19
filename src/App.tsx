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
} from './components/modules'
import { useStore } from './store/useStore'
import type { ModuleName } from './types'

function App() {
  const [activeModule, setActiveModule] = useState<ModuleName>('plan-run')
  const { loading, loadingMessage } = useStore()

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

export default App
