import { AnimatePresence } from 'framer-motion'
import { useStore } from '../../store/useStore'
import { PhaseStepper } from '../ui'
import {
  Phase1Gatilho,
  Phase2Inteligencia,
  Phase3Criacao,
  Phase4Estudio,
  Phase5Entrega,
} from '../phases'

export function PlanRun() {
  const { faseAtual, setFaseAtual, resetPipeline } = useStore()

  const handleNext = () => {
    const phases = ['gatilho', 'inteligencia', 'criacao', 'estudio', 'entrega'] as const
    const currentIndex = phases.indexOf(faseAtual)
    if (currentIndex < phases.length - 1) {
      setFaseAtual(phases[currentIndex + 1])
    }
  }

  const handleBack = () => {
    const phases = ['gatilho', 'inteligencia', 'criacao', 'estudio', 'entrega'] as const
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
      {/* Phase Stepper */}
      <PhaseStepper currentPhase={faseAtual} onPhaseClick={setFaseAtual} />

      {/* Phase Content */}
      <AnimatePresence mode="wait">
        {faseAtual === 'gatilho' && (
          <Phase1Gatilho key="gatilho" onNext={handleNext} />
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
