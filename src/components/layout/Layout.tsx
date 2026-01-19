import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import type { ModuleName } from '../../types'

interface LayoutProps {
  children: ReactNode
  activeModule: ModuleName
  onModuleChange: (module: ModuleName) => void
}

export function Layout({ children, activeModule, onModuleChange }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeModule={activeModule} onModuleChange={onModuleChange} />

      <div className="ml-64">
        <Header />

        <main className="p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-white/5">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>AUTNEW Starter V1 - Mundo da Prece</span>
            <span>
              Atualizado: {new Date().toLocaleString('pt-BR')}
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}
