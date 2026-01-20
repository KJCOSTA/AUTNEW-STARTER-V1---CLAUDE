import { motion } from 'framer-motion'
import { Zap, Brain, Palette, Film, Send, Check, FileText } from 'lucide-react'
import clsx from 'clsx'
import type { PipelinePhase } from '../../types'

interface PhaseStepperProps {
  currentPhase: PipelinePhase
  onPhaseClick?: (phase: PipelinePhase) => void
}

const phases: { id: PipelinePhase; label: string; icon: typeof Zap }[] = [
  { id: 'gatilho', label: 'Gatilho', icon: Zap },
  { id: 'planejamento', label: 'Planejamento', icon: FileText },
  { id: 'inteligencia', label: 'Inteligência', icon: Brain },
  { id: 'criacao', label: 'Criação', icon: Palette },
  { id: 'estudio', label: 'Estúdio', icon: Film },
  { id: 'entrega', label: 'Entrega', icon: Send },
]

const phaseOrder: PipelinePhase[] = ['gatilho', 'planejamento', 'inteligencia', 'criacao', 'estudio', 'entrega']

export function PhaseStepper({ currentPhase, onPhaseClick }: PhaseStepperProps) {
  const currentIndex = phaseOrder.indexOf(currentPhase)

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {phases.map((phase, index) => {
          const Icon = phase.icon
          const isActive = phase.id === currentPhase
          const isCompleted = index < currentIndex
          const isClickable = onPhaseClick && index <= currentIndex

          return (
            <div key={phase.id} className="flex items-center flex-1 last:flex-initial">
              <button
                onClick={() => isClickable && onPhaseClick(phase.id)}
                disabled={!isClickable}
                className={clsx(
                  'flex flex-col items-center gap-2 transition-all duration-300',
                  isClickable && 'cursor-pointer hover:scale-105',
                  !isClickable && 'cursor-default'
                )}
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    backgroundColor: isCompleted
                      ? '#22c55e'
                      : isActive
                      ? '#3b82f6'
                      : 'rgba(255,255,255,0.1)',
                  }}
                  className={clsx(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    isActive && 'shadow-lg shadow-accent-blue/30'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <Icon
                      className={clsx(
                        'w-5 h-5',
                        isActive ? 'text-white' : 'text-text-secondary'
                      )}
                    />
                  )}
                </motion.div>
                <span
                  className={clsx(
                    'text-xs font-medium',
                    isActive
                      ? 'text-accent-blue'
                      : isCompleted
                      ? 'text-status-success'
                      : 'text-text-secondary'
                  )}
                >
                  {phase.label}
                </span>
              </button>

              {/* Connector line */}
              {index < phases.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 relative">
                  <div className="absolute inset-0 bg-white/10 rounded-full" />
                  <motion.div
                    initial={false}
                    animate={{
                      width: index < currentIndex ? '100%' : '0%',
                    }}
                    className={clsx(
                      'absolute inset-y-0 left-0 rounded-full',
                      index < currentIndex ? 'bg-status-success' : 'bg-accent-blue'
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
