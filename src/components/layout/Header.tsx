import { motion } from 'framer-motion'
import { Bell, User, Zap, Moon } from 'lucide-react'
import { useStore } from '../../store/useStore'

export function Header() {
  const { configuracoes } = useStore()
  const isMVP = configuracoes.modo === 'mvp'

  return (
    <header className="h-16 border-b border-white/5 bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      {/* Left side - Page title could go here */}
      <div className="flex items-center gap-4">
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
        {/* Quick actions */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
        >
          <Zap className="w-5 h-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
        >
          <Moon className="w-5 h-5" />
        </motion.button>

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
