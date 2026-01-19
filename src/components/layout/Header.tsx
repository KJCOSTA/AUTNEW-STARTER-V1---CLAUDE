import { motion } from 'framer-motion'
import { Bell, User, FlaskConical } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Toggle } from '../ui/Toggle'

export function Header() {
  const { configuracoes, setConfiguracoes } = useStore()
  const isMVP = configuracoes.modo === 'mvp'
  const isTestMode = configuracoes.appMode === 'test'

  const toggleTestMode = () => {
    setConfiguracoes({
      appMode: isTestMode ? 'production' : 'test',
    })
  }

  return (
    <header className="h-16 border-b border-white/5 bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      {/* Left side - Mode indicators */}
      <div className="flex items-center gap-6">
        {/* Test Mode Badge */}
        {isTestMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30"
          >
            <FlaskConical className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
              Test Mode
            </span>
          </motion.div>
        )}

        {/* Operation Mode indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isMVP ? 'bg-status-warning' : 'bg-status-success'
            }`}
          />
          <span className="text-sm text-text-secondary">
            Modo {isMVP ? 'MVP' : 'Produção'}
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Test Mode Toggle */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/5">
          <FlaskConical
            className={`w-4 h-4 ${isTestMode ? 'text-amber-400' : 'text-text-secondary'}`}
          />
          <Toggle
            checked={isTestMode}
            onChange={toggleTestMode}
            label={isTestMode ? 'Teste' : 'Produção'}
          />
        </div>

        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2 rounded-lg bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-status-error" />
        </motion.button>

        {/* User avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-accent flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
      </div>
    </header>
  )
}
