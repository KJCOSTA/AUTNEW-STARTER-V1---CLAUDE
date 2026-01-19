import { motion } from 'framer-motion'
import {
  Play,
  FileText,
  Activity,
  Clock,
  Settings,
  Sparkles,
} from 'lucide-react'
import type { ModuleName } from '../../types'
import clsx from 'clsx'

interface SidebarProps {
  activeModule: ModuleName
  onModuleChange: (module: ModuleName) => void
}

const menuItems = [
  { id: 'plan-run' as ModuleName, label: 'Plan Run', icon: Play },
  { id: 'diretrizes' as ModuleName, label: 'Diretrizes', icon: FileText },
  { id: 'monitor' as ModuleName, label: 'Monitor', icon: Activity },
  { id: 'historico' as ModuleName, label: 'Histórico', icon: Clock },
  { id: 'configuracoes' as ModuleName, label: 'Configurações', icon: Settings },
]

export function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-white/5 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">AUTNEW</h1>
            <p className="text-xs text-text-secondary">Starter V1</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeModule === item.id

            return (
              <li key={item.id}>
                <button
                  onClick={() => onModuleChange(item.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-gradient-accent text-white shadow-lg shadow-accent-blue/20'
                      : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-2 h-2 rounded-full bg-white"
                    />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <div className="px-4 py-3 rounded-xl bg-background/50">
          <p className="text-xs text-text-secondary">Canal</p>
          <p className="text-sm font-medium text-text-primary truncate">
            Mundo da Prece
          </p>
        </div>
      </div>
    </aside>
  )
}
