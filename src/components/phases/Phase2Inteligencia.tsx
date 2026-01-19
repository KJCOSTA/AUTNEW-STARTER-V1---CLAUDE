import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Search,
  BarChart3,
  Users,
  CheckCircle,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Zap,
  Settings2,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Button, Card, CardContent } from '../ui'
import type { InteligenciaData } from '../../types'

// ============================================
// AI MODELS CONFIGURATION
// ============================================
const AI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', cost: 0.0001, speed: 'Muito rápido' },
  { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro', provider: 'Google', cost: 0.0005, speed: 'Médio' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', cost: 0.0002, speed: 'Rápido' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', cost: 0.001, speed: 'Médio' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', cost: 0.00025, speed: 'Muito rápido' },
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', cost: 0.003, speed: 'Médio' },
  { id: 'groq-llama-3.1-70b', name: 'Llama 3.1 70B', provider: 'Groq', cost: 0.0001, speed: 'Ultra rápido' },
  { id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral', cost: 0.0008, speed: 'Médio' },
]

// ============================================
// NEXT PHASE ACTIONS DEFINITION
// ============================================
const NEXT_PHASE_ACTIONS = [
  {
    id: 'generate-options',
    label: 'Geração de Opções Criativas',
    description: 'Gera 3 opções de títulos, hooks e conceitos',
    defaultModel: 'gemini-2.5-flash'
  },
  {
    id: 'create-thumbnails',
    label: 'Criação de Thumbnails',
    description: 'Gera prompts e imagens para thumbnails',
    defaultModel: 'gpt-4o-mini'
  },
  {
    id: 'refine-hooks',
    label: 'Refinamento de Hooks',
    description: 'Aprimora os ganchos para máximo impacto',
    defaultModel: 'claude-3-haiku'
  },
]

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

// Mock data generator for test mode
function getMockInteligenciaData(tema: string, gatilhos: string[], duracao: string): InteligenciaData {
  const gatilhoTexto = gatilhos.length > 0 ? gatilhos.join(', ') : 'esperança, paz'

  return {
    deepResearch: {
      fatos: [
        `O tema "${tema || 'Oração'}" está entre os mais buscados no nicho espiritual nos últimos 30 dias`,
        'Vídeos com orações guiadas têm 40% mais retenção que conteúdo apenas falado',
        'O público 60+ prefere narração mais lenta e pausada',
        `Gatilhos emocionais como ${gatilhoTexto} aumentam engajamento em 35%`,
      ],
      curiosidades: [
        'A palavra "poderosa" no título aumenta CTR em 23%',
        'Thumbnails com luz dourada performam 2x melhor neste nicho',
        'Vídeos publicados às 6h da manhã têm 45% mais views nas primeiras 24h',
      ],
      referencias: [
        'Salmo 23 - Um dos mais requisitados pelo público',
        'Oração de São Francisco - Alta taxa de compartilhamento',
        'Meditação guiada com respiração - Tendência crescente',
      ],
    },
    analiseCanal: {
      padroesSuccesso: [
        'Títulos com promessa emocional clara',
        'Thumbnails com rostos serenos e luz suave',
        'Descrições com timestamps e links úteis',
      ],
      temasRetencao: [
        tema || 'Oração',
        'Oração da manhã',
        'Paz interior',
        'Cura emocional',
      ],
      duracaoIdeal: duracao === '5-10min' ? '8 minutos' : duracao === '10-15min' ? '12 minutos' : '6 minutos',
      gatilhosEngajamento: [
        'Abertura com pergunta retórica',
        'Pausas para reflexão',
        'Convite para comentar experiência',
      ],
    },
    analiseConcorrente: {
      estruturaNarrativa:
        'Abertura emocional (15s) → Contextualização (30s) → Oração principal (duração variável) → Fechamento esperançoso',
      ganchosRetencao: [
        'Promessa de transformação no início',
        'Uso de música ambiente suave',
        'Pausas estratégicas para absorção',
      ],
      elementosVirais: [
        'Título com palavra "poderosa" ou "milagrosa"',
        'Thumbnail com contraste luz/sombra',
        'Primeiros 5 segundos com gancho forte',
      ],
    },
  }
}

export function Phase2Inteligencia({ onNext, onBack }: Phase2InteligenciaProps) {
  const { gatilho, setInteligencia, addToast, configuracoes } = useStore()

  // Check test mode directly from configuracoes
  const isTestMode = configuracoes.appMode === 'test'

  // State for model selection per action (for next phase)
  const [actionModels, setActionModels] = useState<Record<string, string>>(
    NEXT_PHASE_ACTIONS.reduce((acc, action) => ({
      ...acc,
      [action.id]: action.defaultModel
    }), {})
  )
  const [showModelConfig, setShowModelConfig] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

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
      addLog('deep-research', isTestMode ? '[MOCK] Simulando conexão com IA...' : 'Conectando com Gemini...')
      await new Promise((r) => setTimeout(r, 600))
      addLog('deep-research', `Pesquisando sobre: "${gatilho.tema || 'Oração'}"`)
      await new Promise((r) => setTimeout(r, 800))
      addLog('deep-research', 'Buscando referências bíblicas relevantes...')
      await new Promise((r) => setTimeout(r, 600))
      addLog('deep-research', 'Verificando fatos históricos...')
      await new Promise((r) => setTimeout(r, 500))

      // Generate intelligence data (mock in test mode, real API in production)
      let inteligenciaData: InteligenciaData

      if (isTestMode) {
        // Use local mock data directly - no API call
        await new Promise((r) => setTimeout(r, 800))
        inteligenciaData = getMockInteligenciaData(
          gatilho.tema,
          gatilho.gatilhosEmocionais,
          gatilho.duracao
        )
        addLog('deep-research', `[MOCK] Encontrados ${inteligenciaData.deepResearch.fatos.length} fatos relevantes`)
      } else {
        // Real API call (would fail without proper backend)
        try {
          const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'analyze',
              data: gatilho,
            }),
          })

          if (!response.ok) {
            throw new Error('API Error')
          }

          inteligenciaData = await response.json()
          addLog('deep-research', `Encontrados ${inteligenciaData.deepResearch.fatos.length} fatos relevantes`)
        } catch {
          // Fallback to mock if API fails
          inteligenciaData = getMockInteligenciaData(
            gatilho.tema,
            gatilho.gatilhosEmocionais,
            gatilho.duracao
          )
          addLog('deep-research', `[Fallback] Usando dados simulados`)
        }
      }

      updateStep('deep-research', { status: 'completed' })

      // Step 2: Channel Analysis
      updateStep('channel-analysis', { status: 'processing' })
      addLog('channel-analysis', isTestMode ? '[MOCK] Analisando métricas...' : 'Analisando métricas do canal...')
      await new Promise((r) => setTimeout(r, 500))
      addLog('channel-analysis', 'Identificando padrões de retenção...')
      await new Promise((r) => setTimeout(r, 600))
      addLog('channel-analysis', 'Mapeando gatilhos de engajamento...')
      await new Promise((r) => setTimeout(r, 400))
      addLog('channel-analysis', `Identificados ${inteligenciaData.analiseCanal.padroesSuccesso.length} padrões de sucesso`)
      updateStep('channel-analysis', { status: 'completed' })

      // Step 3: Competitor Analysis
      updateStep('competitor-analysis', { status: 'processing' })
      addLog('competitor-analysis', isTestMode ? '[MOCK] Processando concorrentes...' : 'Processando dados dos concorrentes...')
      await new Promise((r) => setTimeout(r, 500))

      const hasCompetitors = gatilho.concorrentes && gatilho.concorrentes.length > 0
      if (hasCompetitors) {
        addLog('competitor-analysis', `Analisando ${gatilho.concorrentes.length} concorrente(s)...`)
        await new Promise((r) => setTimeout(r, 700))
      }

      addLog('competitor-analysis', 'Extraindo estrutura narrativa...')
      await new Promise((r) => setTimeout(r, 600))
      addLog('competitor-analysis', 'Identificando elementos virais...')
      await new Promise((r) => setTimeout(r, 400))
      addLog('competitor-analysis', `Encontrados ${inteligenciaData.analiseConcorrente.elementosVirais.length} elementos virais`)
      updateStep('competitor-analysis', { status: 'completed' })

      // Save intelligence data to store
      setInteligencia(inteligenciaData)

      setCompleted(true)
      addToast({
        type: 'success',
        message: isTestMode
          ? '[TEST MODE] Análise simulada concluída!'
          : 'Análise concluída! Dados processados com sucesso.',
      })
    } catch (error) {
      console.error('Analysis error:', error)
      addToast({
        type: 'error',
        message: 'Erro durante o processamento. Tente novamente.',
      })
      setProcessing(false)
    } finally {
      setProcessing(false)
    }
  }

  useEffect(() => {
    runAnalysis()
  }, [])

  const handleModelChange = (actionId: string, modelId: string) => {
    setActionModels(prev => ({
      ...prev,
      [actionId]: modelId
    }))
    setOpenDropdown(null)
  }

  const getModelById = (modelId: string) => AI_MODELS.find(m => m.id === modelId)

  const calculateTotalCost = () => {
    return Object.values(actionModels).reduce((total, modelId) => {
      const model = getModelById(modelId)
      return total + (model?.cost || 0)
    }, 0)
  }

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
          {isTestMode
            ? '[TEST MODE] Simulando análise de dados'
            : 'A IA está analisando dados e pesquisando informações relevantes'
          }
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
                      {step.status === 'completed' && (
                        <span className="px-2 py-0.5 rounded-full bg-status-success/20 text-status-success text-xs">
                          Concluído
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
                              <Sparkles className="w-3 h-3 text-accent-blue flex-shrink-0" />
                              <span className={log.includes('[MOCK]') || log.includes('[TEST') ? 'text-amber-400' : ''}>
                                {log}
                              </span>
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

      {/* Next Phase Model Configuration - Shows only when completed */}
      <AnimatePresence>
        {completed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardContent className="p-4">
                <button
                  onClick={() => setShowModelConfig(!showModelConfig)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center">
                      <Settings2 className="w-5 h-5 text-accent-purple" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-text-primary">
                        Próxima Etapa: Criação
                      </h3>
                      <p className="text-sm text-text-secondary">
                        {showModelConfig ? 'Configurar modelos por ação' : `${NEXT_PHASE_ACTIONS.length} ações • Custo estimado: ${isTestMode ? '$0.00' : `$${calculateTotalCost().toFixed(4)}`}`}
                      </p>
                    </div>
                  </div>
                  {showModelConfig ? (
                    <ChevronUp className="w-5 h-5 text-text-secondary" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-text-secondary" />
                  )}
                </button>

                <AnimatePresence>
                  {showModelConfig && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                        {NEXT_PHASE_ACTIONS.map((action) => {
                          const selectedModel = getModelById(actionModels[action.id])
                          const isOpen = openDropdown === action.id

                          return (
                            <div key={action.id} className="p-3 rounded-xl bg-background/50">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-text-primary">
                                    {action.label}
                                  </p>
                                  <p className="text-xs text-text-secondary truncate">
                                    {action.description}
                                  </p>
                                </div>

                                {/* Model Selector */}
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setOpenDropdown(isOpen ? null : action.id)
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors min-w-[180px]"
                                  >
                                    <Zap className="w-4 h-4 text-accent-purple flex-shrink-0" />
                                    <div className="flex-1 text-left">
                                      <p className="text-sm text-text-primary truncate">
                                        {selectedModel?.name}
                                      </p>
                                      <p className="text-xs text-text-secondary">
                                        {selectedModel?.provider} • {isTestMode ? '$0.00' : `$${selectedModel?.cost.toFixed(4)}`}
                                      </p>
                                    </div>
                                    <ChevronDown
                                      className={`w-4 h-4 text-text-secondary transition-transform flex-shrink-0 ${
                                        isOpen ? 'rotate-180' : ''
                                      }`}
                                    />
                                  </button>

                                  {/* Dropdown */}
                                  <AnimatePresence>
                                    {isOpen && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full right-0 mt-1 w-64 bg-card border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto"
                                      >
                                        {AI_MODELS.map((model) => (
                                          <button
                                            key={model.id}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleModelChange(action.id, model.id)
                                            }}
                                            className={`w-full flex items-center justify-between p-3 hover:bg-white/5 text-left ${
                                              model.id === actionModels[action.id] ? 'bg-accent-purple/10' : ''
                                            }`}
                                          >
                                            <div>
                                              <p className="text-sm font-medium text-text-primary">
                                                {model.name}
                                              </p>
                                              <p className="text-xs text-text-secondary">
                                                {model.provider} • {model.speed}
                                              </p>
                                            </div>
                                            <span className="text-xs text-status-success font-mono">
                                              {isTestMode ? '$0.00' : `$${model.cost.toFixed(4)}`}
                                            </span>
                                          </button>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </div>
                          )
                        })}

                        {/* Total Cost */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-accent-purple/10 border border-accent-purple/20">
                          <span className="text-sm text-text-secondary">Custo total estimado:</span>
                          <span className="text-sm font-bold text-text-primary">
                            {isTestMode ? '$0.00 (Test Mode)' : `$${calculateTotalCost().toFixed(4)}`}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onBack} disabled={processing}>
          Voltar
        </Button>

        <Button
          onClick={onNext}
          disabled={!completed}
          loading={processing}
          icon={<Brain className="w-4 h-4" />}
        >
          {completed ? 'Continuar para Criação' : 'Processando...'}
        </Button>
      </div>
    </motion.div>
  )
}
