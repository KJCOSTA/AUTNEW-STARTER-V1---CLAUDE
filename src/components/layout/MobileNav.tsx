import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
  Zap,
  Sparkles,
  Activity,
  Settings,
  Brain,
  Palette,
  Film,
  Upload,
  FileText,
  ChevronRight,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import type { ModuleName } from '../../types'

interface MobileNavProps {
  activeModule: ModuleName
  onModuleChange: (module: ModuleName) => void
  currentPhase: number
  isProcessing: boolean
}

const modules: Array<{ id: ModuleName; name: string; icon: typeof Zap; description: string }> = [
  { id: 'plan-run', name: 'Criar Vídeo', icon: Zap, description: 'Fluxo de produção' },
  { id: 'diretrizes', name: 'Diretrizes', icon: FileText, description: 'Regras do canal' },
  { id: 'monitor', name: 'Monitor', icon: Activity, description: 'Status e custos' },
  { id: 'configuracoes', name: 'Configurações', icon: Settings, description: 'API Keys' },
]

const phases = [
  { id: 1, name: 'Gatilho', icon: Zap },
  { id: 2, name: 'Planejamento', icon: FileText },
  { id: 3, name: 'Inteligência', icon: Brain },
  { id: 4, name: 'Criação', icon: Palette },
  { id: 5, name: 'Estúdio', icon: Film },
  { id: 6, name: 'Entrega', icon: Upload },
]

export function MobileNav({ activeModule, onModuleChange, currentPhase, isProcessing }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { configuracoes } = useStore()
  const isTestMode = configuracoes.appMode === 'test'

  const handleModuleClick = (moduleId: ModuleName) => {
    onModuleChange(moduleId)
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-card/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 z-40 md:hidden">
        {/* Menu Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <Menu className="w-5 h-5 text-text-primary" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-text-primary">AUTNEW</span>
        </div>

        {/* Mode Badge */}
        <div className={`px-2 py-1 rounded-md text-[10px] font-bold ${
          isTestMode
            ? 'bg-amber-500/20 text-amber-400'
            : 'bg-status-success/20 text-status-success'
        }`}>
          {isTestMode ? 'TESTE' : 'REAL'}
        </div>
      </div>

      {/* Mobile Bottom Navigation - Quick access */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around px-2 z-40 md:hidden">
        {modules.slice(0, 4).map((module) => {
          const Icon = module.icon
          const isActive = activeModule === module.id
          return (
            <button
              key={module.id}
              onClick={() => handleModuleClick(module.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-accent-purple bg-accent-purple/10'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{module.name.split(' ')[0]}</span>
            </button>
          )
        })}
      </div>

      {/* Full Screen Menu Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-card border-r border-white/10 z-50 md:hidden overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-text-primary">AUTNEW</h2>
                    <p className="text-xs text-text-secondary">Starter V1</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              {/* Current Phase Progress (only in plan-run) */}
              {activeModule === 'plan-run' && (
                <div className="p-4 border-b border-white/10">
                  <p className="text-xs text-text-secondary mb-3">Progresso da Produção</p>
                  <div className="space-y-2">
                    {phases.map((phase) => {
                      const Icon = phase.icon
                      const isCompleted = phase.id < currentPhase
                      const isCurrent = phase.id === currentPhase
                      return (
                        <div
                          key={phase.id}
                          className={`flex items-center gap-3 p-2 rounded-lg ${
                            isCurrent
                              ? 'bg-accent-purple/10 border border-accent-purple/30'
                              : isCompleted
                              ? 'bg-status-success/5'
                              : 'opacity-50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isCurrent
                              ? 'bg-accent-purple/20 text-accent-purple'
                              : isCompleted
                              ? 'bg-status-success/20 text-status-success'
                              : 'bg-white/5 text-text-secondary'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <span className={`text-sm font-medium ${
                              isCurrent ? 'text-accent-purple' : 'text-text-primary'
                            }`}>
                              {phase.name}
                            </span>
                          </div>
                          {isCurrent && isProcessing && (
                            <div className="w-4 h-4 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
                          )}
                          {isCompleted && (
                            <div className="w-4 h-4 rounded-full bg-status-success/20 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-status-success" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Modules List */}
              <div className="p-4">
                <p className="text-xs text-text-secondary mb-3 uppercase tracking-wide">Módulos</p>
                <div className="space-y-1">
                  {modules.map((module) => {
                    const Icon = module.icon
                    const isActive = activeModule === module.id
                    return (
                      <button
                        key={module.id}
                        onClick={() => handleModuleClick(module.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                          isActive
                            ? 'bg-gradient-accent text-white'
                            : 'hover:bg-white/5 text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <div className="flex-1 text-left">
                          <span className="text-sm font-medium">{module.name}</span>
                          <p className={`text-xs ${isActive ? 'text-white/70' : 'text-text-secondary'}`}>
                            {module.description}
                          </p>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white/50' : 'text-text-secondary/50'}`} />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="p-4 border-t border-white/10 mt-auto">
                <div className={`p-3 rounded-xl ${
                  isTestMode ? 'bg-amber-500/10' : 'bg-status-success/10'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${
                        isTestMode ? 'text-amber-400' : 'text-status-success'
                      }`}>
                        {isTestMode ? 'Modo Teste' : 'Modo Real'}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {isTestMode ? 'Dados simulados' : 'APIs ativas'}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-md text-xs font-bold ${
                      isTestMode
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-status-success/20 text-status-success'
                    }`}>
                      {isTestMode ? 'TESTE' : 'REAL'}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
