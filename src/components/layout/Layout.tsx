import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { useStore } from '../../store/useStore'
import type { ModuleName } from '../../types'

interface LayoutProps {
  children: ReactNode
  activeModule: ModuleName
  onModuleChange: (module: ModuleName) => void
}

export function Layout({ children, activeModule, onModuleChange }: LayoutProps) {
  const isMobile = useIsMobile()
  const { faseAtual } = useStore()

  // Convert phase string to number for MobileNav
  const phaseMap: Record<string, number> = {
    gatilho: 1,
    planejamento: 2,
    inteligencia: 3,
    criacao: 4,
    estudio: 5,
    entrega: 6,
  }
  const currentPhaseNumber = phaseMap[faseAtual] || 1

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNav
          activeModule={activeModule}
          onModuleChange={onModuleChange}
          currentPhase={currentPhaseNumber}
          isProcessing={false}
        />
      )}

      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar activeModule={activeModule} onModuleChange={onModuleChange} />
      </div>

      {/* Main content area */}
      <div className={`
        transition-all duration-300
        ${isMobile ? 'ml-0 pt-14 pb-20' : 'ml-64'}
      `}>
        {/* Desktop Header - hidden on mobile */}
        {!isMobile && <Header />}

        <main className={`
          ${isMobile ? 'p-4' : 'p-6'}
        `}>
          {children}
        </main>

        {/* Footer - hidden on mobile for more space */}
        {!isMobile && (
          <footer className="px-6 py-4 border-t border-white/5">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>AUTNEW Starter V1 - Mundo da Prece</span>
              <span>
                Atualizado: {new Date().toLocaleString('pt-BR')}
              </span>
            </div>
          </footer>
        )}
      </div>
    </div>
  )
}
