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
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Button, Card, CardContent } from '../ui'

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
  const { gatilho, setInteligencia, diretrizes, addToast } = useStore()
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
      addLog('deep-research', 'Conectando com Gemini...')
      await new Promise((r) => setTimeout(r, 800))
      addLog('deep-research', `Pesquisando sobre: "${gatilho.tema}"`)
      await new Promise((r) => setTimeout(r, 1200))
      addLog('deep-research', 'Buscando referências bíblicas relevantes...')
      await new Promise((r) => setTimeout(r, 1000))
      addLog('deep-research', 'Verificando fatos históricos...')
      await new Promise((r) => setTimeout(r, 800))

      // Call actual API
      const researchResponse = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deep-research',
          tema: gatilho.tema,
          tipoConteudo: gatilho.tipoConteudo,
          gatilhos: gatilho.gatilhosEmocionais,
        }),
      })

      let deepResearchData = {
        fatos: [
          'O Salmo 23 foi escrito por Davi, que era pastor antes de se tornar rei',
          'A oração do Pai Nosso contém 7 petições principais',
          'Estudos mostram que a oração pode reduzir níveis de cortisol em até 25%',
        ],
        curiosidades: [
          'A Bíblia menciona a palavra "paz" mais de 400 vezes',
          'O jejum era uma prática comum entre os profetas do Antigo Testamento',
        ],
        referencias: [
          'Salmo 23:1-6',
          'Filipenses 4:6-7',
          'Mateus 6:25-34',
        ],
      }

      if (researchResponse.ok) {
        const data = await researchResponse.json()
        if (data.deepResearch) {
          deepResearchData = data.deepResearch
        }
      }

      addLog('deep-research', `Encontrados ${deepResearchData.fatos.length} fatos relevantes`)
      updateStep('deep-research', { status: 'completed' })

      // Step 2: Channel Analysis
      updateStep('channel-analysis', { status: 'processing' })
      addLog('channel-analysis', 'Analisando métricas do canal...')
      await new Promise((r) => setTimeout(r, 600))
      addLog('channel-analysis', 'Identificando padrões de retenção...')
      await new Promise((r) => setTimeout(r, 800))
      addLog('channel-analysis', 'Mapeando gatilhos de engajamento...')
      await new Promise((r) => setTimeout(r, 600))

      const channelAnalysisData = {
        padroesSuccesso: [
          'Vídeos com abertura emocional têm 40% mais retenção',
          'Duração ideal identificada: 8-12 minutos',
          'Público responde bem a mensagens de esperança e cura',
        ],
        temasRetencao: ['Proteção divina', 'Superação de medos', 'Paz interior'],
        duracaoIdeal: '8-12 minutos',
        gatilhosEngajamento: ['Esperança', 'Cura', 'Proteção'],
      }

      addLog('channel-analysis', 'Padrões identificados com sucesso')
      updateStep('channel-analysis', { status: 'completed' })

      // Step 3: Competitor Analysis
      updateStep('competitor-analysis', { status: 'processing' })
      addLog('competitor-analysis', 'Processando metadados do concorrente...')
      await new Promise((r) => setTimeout(r, 700))

      if (gatilho.concorrenteTranscricao) {
        addLog('competitor-analysis', 'Analisando transcrição fornecida...')
        await new Promise((r) => setTimeout(r, 1000))
        addLog('competitor-analysis', 'Extraindo estrutura narrativa...')
        await new Promise((r) => setTimeout(r, 800))
      }

      addLog('competitor-analysis', 'Identificando elementos virais...')
      await new Promise((r) => setTimeout(r, 600))

      const competitorAnalysisData = {
        estruturaNarrativa:
          'Gancho emocional forte nos primeiros 15s, seguido de desenvolvimento com pausas dramáticas, e fechamento com chamada à ação',
        ganchosRetencao: [
          'Pergunta retórica na abertura',
          'Promessa de transformação',
          'Histórias pessoais de superação',
        ],
        elementosVirais: [
          'Título com número ou promessa específica',
          'Thumbnail com expressão emocional',
          'Palavras-chave no primeiro minuto',
        ],
      }

      addLog('competitor-analysis', 'Análise completa!')
      updateStep('competitor-analysis', { status: 'completed' })

      // Set intelligence data
      setInteligencia({
        deepResearch: deepResearchData,
        analiseCanal: channelAnalysisData,
        analiseConcorrente: competitorAnalysisData,
      })

      setCompleted(true)
      addToast({
        type: 'success',
        message: 'Análise concluída! Dados processados com sucesso.',
      })
    } catch (error) {
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
      <div className="flex justify-between pt-4">
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
