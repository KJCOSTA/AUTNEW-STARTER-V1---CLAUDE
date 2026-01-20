import { AnimatePresence } from 'framer-motion'
import { FlaskConical, Rocket } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { PhaseStepper } from '../ui'
import {
  Phase1Gatilho,
  PhasePlanejamento,
  Phase2Inteligencia,
  Phase3Criacao,
  Phase4Estudio,
  Phase5Entrega,
} from '../phases'

export function PlanRun() {
  const { faseAtual, setFaseAtual, resetPipeline, configuracoes } = useStore()

  const isTestMode = configuracoes.appMode === 'test'

  const handleNext = () => {
    const phases = ['gatilho', 'planejamento', 'inteligencia', 'criacao', 'estudio', 'entrega'] as const
    const currentIndex = phases.indexOf(faseAtual)
    if (currentIndex < phases.length - 1) {
      setFaseAtual(phases[currentIndex + 1])
    }
  }

  const handleBack = () => {
    const phases = ['gatilho', 'planejamento', 'inteligencia', 'criacao', 'estudio', 'entrega'] as const
    const currentIndex = phases.indexOf(faseAtual)
    if (currentIndex > 0) {
      setFaseAtual(phases[currentIndex - 1])
    }
  }

  const handleReset = () => {
    resetPipeline()
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Mode Indicator */}
      <div className="flex justify-end mb-2">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
            isTestMode
              ? 'bg-status-warning/10 border border-status-warning/30 text-status-warning'
              : 'bg-status-success/10 border border-status-success/30 text-status-success'
          }`}
        >
          {isTestMode ? (
            <>
              <FlaskConical className="w-4 h-4" />
              Modo Teste
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              Modo Produção
            </>
          )}
        </div>
      </div>

      {/* Phase Stepper */}
      <PhaseStepper currentPhase={faseAtual} onPhaseClick={setFaseAtual} />

      {/* Phase Content */}
      <AnimatePresence mode="wait">
        {faseAtual === 'gatilho' && (
          <Phase1Gatilho key="gatilho" onNext={handleNext} />
        )}
        {faseAtual === 'planejamento' && (
          <PhasePlanejamento
            key="planejamento"
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {faseAtual === 'inteligencia' && (
          <Phase2Inteligencia
            key="inteligencia"
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {faseAtual === 'criacao' && (
          <Phase3Criacao
            key="criacao"
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {faseAtual === 'estudio' && (
          <Phase4Estudio
            key="estudio"
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {faseAtual === 'entrega' && (
          <Phase5Entrega key="entrega" onReset={handleReset} />
        )}
      </AnimatePresence>
    </div>
  )
}
