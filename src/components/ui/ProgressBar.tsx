import { motion } from 'framer-motion'
import { CheckCircle, Circle, Loader2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import type { PipelinePhase } from '../../types'

const PHASES: { id: PipelinePhase; label: string; weight: number }[] = [
  { id: 'gatilho', label: 'Gatilho', weight: 20 },
  { id: 'inteligencia', label: 'Inteligencia', weight: 20 },
  { id: 'criacao', label: 'Criacao', weight: 20 },
  { id: 'estudio', label: 'Estudio', weight: 20 },
  { id: 'entrega', label: 'Entrega', weight: 20 },
]

export function ProgressBar() {
  const { faseAtual, gatilho, inteligencia, criacao, estudio, entrega } = useStore()

  // Calculate completion based on phase data
  const getPhaseCompletion = (phaseId: PipelinePhase): 'completed' | 'in_progress' | 'pending' => {
    const currentIndex = PHASES.findIndex(p => p.id === faseAtual)
    const phaseIndex = PHASES.findIndex(p => p.id === phaseId)

    if (phaseIndex < currentIndex) return 'completed'
    if (phaseIndex === currentIndex) return 'in_progress'
    return 'pending'
  }

  // Calculate total progress percentage
  const calculateProgress = (): number => {
    const currentIndex = PHASES.findIndex(p => p.id === faseAtual)
    if (currentIndex === -1) return 0

    // Base progress from completed phases
    let progress = currentIndex * 20

    // Add partial progress for current phase based on data
    switch (faseAtual) {
      case 'gatilho':
        if (gatilho.tema) progress += 5
        if (gatilho.tipoConteudo) progress += 5
        if (gatilho.gatilhosEmocionais && gatilho.gatilhosEmocionais.length > 0) progress += 5
        if (gatilho.duracao) progress += 5
        break
      case 'inteligencia':
        if (inteligencia?.deepResearch) progress += 10
        if (inteligencia?.analiseCanal) progress += 5
        if (inteligencia?.analiseConcorrente) progress += 5
        break
      case 'criacao':
        if (criacao?.roteiro) progress += 7
        if (criacao?.titleVariants && criacao.titleVariants.length > 0) progress += 7
        if (criacao?.thumbVariants && criacao.thumbVariants.length > 0) progress += 6
        break
      case 'estudio':
        if (estudio?.cenas && estudio.cenas.length > 0) {
          const scenesWithVideo = estudio.cenas.filter(c => c.visualUrl).length
          const progress_scenes = (scenesWithVideo / estudio.cenas.length) * 10
          progress += progress_scenes
        }
        if (estudio?.videoRenderizado) progress += 10
        break
      case 'entrega':
        if (entrega?.videoUrl) progress += 20
        break
    }

    return Math.min(progress, 100)
  }

  const progress = calculateProgress()

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-text-primary">Progresso da Producao</h3>
        <span className="text-sm font-bold text-accent-blue">{Math.round(progress)}% completo</span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent-blue to-accent-purple rounded-full"
        />
      </div>

      {/* Phase Indicators */}
      <div className="flex items-center justify-between">
        {PHASES.map((phase, index) => {
          const status = getPhaseCompletion(phase.id)
          const isLast = index === PHASES.length - 1

          return (
            <div key={phase.id} className="flex items-center">
              {/* Phase Circle */}
              <div className="flex flex-col items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-colors
                  ${status === 'completed' ? 'bg-status-success text-white' : ''}
                  ${status === 'in_progress' ? 'bg-accent-blue text-white' : ''}
                  ${status === 'pending' ? 'bg-white/10 text-text-secondary' : ''}
                `}>
                  {status === 'completed' && <CheckCircle className="w-4 h-4" />}
                  {status === 'in_progress' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {status === 'pending' && <Circle className="w-4 h-4" />}
                </div>
                <span className={`text-xs mt-1 ${
                  status === 'in_progress' ? 'text-accent-blue font-medium' : 'text-text-secondary'
                }`}>
                  {phase.label}
                </span>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className={`
                  w-8 sm:w-12 md:w-16 h-0.5 mx-1
                  ${status === 'completed' ? 'bg-status-success' : 'bg-white/10'}
                `} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
