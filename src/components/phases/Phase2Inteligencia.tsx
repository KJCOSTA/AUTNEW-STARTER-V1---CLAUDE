import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Brain,
  Search,
  BarChart3,
  Users,
  CheckCircle,
  Loader2,
  Sparkles,
  ChevronDown,
  DollarSign,
  Zap,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Button, Card, CardContent } from '../ui'
import { analyzeWithGemini } from '../../services/api'

// AI Models configuration
const AI_MODELS = {
  analysis: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', cost: 0.0001, speed: 'fast' },
    { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro', provider: 'Google', cost: 0.0005, speed: 'medium' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', cost: 0.0002, speed: 'fast' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', cost: 0.001, speed: 'medium' },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', cost: 0.00025, speed: 'fast' },
    { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', cost: 0.003, speed: 'medium' },
    { id: 'groq-llama-3.1-70b', name: 'Llama 3.1 70B', provider: 'Groq', cost: 0.0001, speed: 'very-fast' },
    { id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral', cost: 0.0008, speed: 'medium' },
  ],
}

interface Phase2InteligenciaProps {
  onNext: () => void
  onBack: () => void
}

interface ProcessStep {
  id: string
  label: string
  description: string
  icon: typeof Brain
  status: 'pending' | 'processing' | 'completed'
  logs: string[]
}

export function Phase2Inteligencia({ onNext, onBack }: Phase2InteligenciaProps) {
  const { gatilho, setInteligencia, addToast, configuracoes } = useStore()
  const isTestMode = configuracoes.appMode === 'test'

  const [selectedModel, setSelectedModel] = useState(AI_MODELS.analysis[0].id)
  const [showModelDropdown, setShowModelDropdown] = useState(false)

  const [steps, setSteps] = useState<ProcessStep[]>([
    {
      id: 'deep-research',
      label: 'Deep Research',
      description: 'Pesquisando fatos bíblicos, históricos e curiosidades',
      icon: Search,
      status: 'pending',
      logs: [],
    },
    {
      id: 'channel-analysis',
      label: 'Análise do Canal',
      description: 'Identificando padrões de sucesso do seu canal',
      icon: BarChart3,
      status: 'pending',
      logs: [],
    },
    {
      id: 'competitor-analysis',
      label: 'Análise do Concorrente',
      description: 'Extraindo estrutura narrativa e elementos virais',
      icon: Users,
      status: 'pending',
      logs: [],
    },
  ])
  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)

  const currentModel = AI_MODELS.analysis.find((m) => m.id === selectedModel)

  const updateStep = (stepId: string, updates: Partial<ProcessStep>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, ...updates } : s))
    )
  }

  const addLog = (stepId: string, log: string) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId ? { ...s, logs: [...s.logs, log] } : s
      )
    )
  }

  const runAnalysis = async () => {
    setProcessing(true)

    try {
      // Step 1: Deep Research
      updateStep('deep-research', { status: 'processing' })
      addLog('deep-research', isTestMode ? '[TEST MODE] Simulando conexão...' : `Conectando com ${currentModel?.name}...`)
      await new Promise((r) => setTimeout(r, 800))
      addLog('deep-research', `Pesquisando sobre: "${gatilho.tema}"`)
      await new Promise((r) => setTimeout(r, 1200))
      addLog('deep-research', 'Buscando referências bíblicas relevantes...')
      await new Promise((r) => setTimeout(r, 1000))
      addLog('deep-research', 'Verificando fatos históricos...')
      await new Promise((r) => setTimeout(r, 800))

      // Use API service (handles test mode automatically)
      const inteligenciaData = await analyzeWithGemini(gatilho)

      addLog('deep-research', `Encontrados ${inteligenciaData.deepResearch.fatos.length} fatos relevantes`)
      updateStep('deep-research', { status: 'completed' })

      // Step 2: Channel Analysis
      updateStep('channel-analysis', { status: 'processing' })
      addLog('channel-analysis', 'Analisando métricas do canal...')
      await new Promise((r) => setTimeout(r, 600))
      addLog('channel-analysis', 'Identificando padrões de retenção...')
      await new Promise((r) => setTimeout(r, 800))
      addLog('channel-analysis', 'Mapeando gatilhos de engajamento...')
      await new Promise((r) => setTimeout(r, 600))
      addLog('channel-analysis', `Identificados ${inteligenciaData.analiseCanal.padroesSuccesso.length} padrões de sucesso`)
      updateStep('channel-analysis', { status: 'completed' })

      // Step 3: Competitor Analysis
      updateStep('competitor-analysis', { status: 'processing' })
      addLog('competitor-analysis', 'Processando dados dos concorrentes...')
      await new Promise((r) => setTimeout(r, 700))

      const hasCompetitors = gatilho.concorrentes && gatilho.concorrentes.length > 0
      if (hasCompetitors) {
        addLog('competitor-analysis', `Analisando ${gatilho.concorrentes.length} concorrente(s)...`)
        await new Promise((r) => setTimeout(r, 1000))
      }

      addLog('competitor-analysis', 'Extraindo estrutura narrativa...')
      await new Promise((r) => setTimeout(r, 800))
      addLog('competitor-analysis', 'Identificando elementos virais...')
      await new Promise((r) => setTimeout(r, 600))
      addLog('competitor-analysis', `Encontrados ${inteligenciaData.analiseConcorrente.elementosVirais.length} elementos virais`)
      updateStep('competitor-analysis', { status: 'completed' })

      // Set intelligence data
      setInteligencia(inteligenciaData)

      setCompleted(true)
      addToast({
        type: 'success',
        message: isTestMode
          ? '[TEST] Análise simulada concluída!'
          : 'Análise concluída! Dados processados com sucesso.',
      })
    } catch (error) {
      console.error('Analysis error:', error)
      addToast({
        type: 'error',
        message: 'Erro durante o processamento. Tente novamente.',
      })
    } finally {
      setProcessing(false)
    }
  }

  useEffect(() => {
    runAnalysis()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          animate={{ rotate: processing ? 360 : 0 }}
          transition={{ duration: 2, repeat: processing ? Infinity : 0, ease: 'linear' }}
          className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-accent flex items-center justify-center"
        >
          <Brain className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold text-text-primary">
          Processamento Inteligente
        </h2>
        <p className="text-text-secondary mt-2">
          A IA está analisando dados e pesquisando informações relevantes
        </p>
      </div>

      {/* Processing Steps */}
      <div className="space-y-4">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <Card key={step.id} variant={step.status === 'processing' ? 'gradient' : 'default'}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      step.status === 'completed'
                        ? 'bg-status-success/20'
                        : step.status === 'processing'
                        ? 'bg-accent-blue/20'
                        : 'bg-white/5'
                    }`}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-6 h-6 text-status-success" />
                    ) : step.status === 'processing' ? (
                      <Loader2 className="w-6 h-6 text-accent-blue animate-spin" />
                    ) : (
                      <Icon className="w-6 h-6 text-text-secondary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-text-primary">{step.label}</h3>
                      {step.status === 'processing' && (
                        <span className="px-2 py-0.5 rounded-full bg-accent-blue/20 text-accent-blue text-xs">
                          Processando
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5">
                      {step.description}
                    </p>

                    {/* Logs */}
                    {step.logs.length > 0 && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        className="mt-3 p-3 bg-background/50 rounded-lg overflow-hidden"
                      >
                        <div className="space-y-1 font-mono text-xs">
                          {step.logs.map((log, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-2 text-text-secondary"
                            >
                              <Sparkles className="w-3 h-3 text-accent-blue" />
                              {log}
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 gap-4">
        <Button variant="ghost" onClick={onBack} disabled={processing}>
          Voltar
        </Button>

        <div className="flex items-center gap-3">
          {/* Model Selector for next phase */}
          {completed && (
            <div className="flex items-center gap-2">
              {/* Cost Preview */}
              <div className="flex items-center gap-1.5 px-3 py-2 bg-white/5 rounded-lg text-xs">
                <DollarSign className="w-3.5 h-3.5 text-status-success" />
                <span className="text-text-secondary">Próx. etapa:</span>
                <span className="text-text-primary font-medium">
                  {isTestMode ? '$0.00' : `~$${((currentModel?.cost || 0) * 3).toFixed(4)}`}
                </span>
              </div>

              {/* Model Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm"
                >
                  <Zap className="w-4 h-4 text-accent-purple" />
                  <span className="text-text-primary">{currentModel?.name}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-text-secondary transition-transform ${
                      showModelDropdown ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showModelDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-full right-0 mb-2 w-64 bg-card border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto"
                  >
                    {AI_MODELS.analysis.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model.id)
                          setShowModelDropdown(false)
                        }}
                        className={`w-full flex items-center justify-between p-3 hover:bg-white/5 text-left ${
                          model.id === selectedModel ? 'bg-white/5' : ''
                        }`}
                      >
                        <div>
                          <div className="text-sm font-medium text-text-primary">
                            {model.name}
                          </div>
                          <div className="text-xs text-text-secondary">
                            {model.provider} • {model.speed}
                          </div>
                        </div>
                        <div className="text-xs text-status-success font-mono">
                          ${model.cost.toFixed(4)}
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          )}

          <Button
            onClick={onNext}
            disabled={!completed}
            loading={processing}
            icon={<Brain className="w-4 h-4" />}
          >
            {completed ? 'Continuar para Criação' : 'Processando...'}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
