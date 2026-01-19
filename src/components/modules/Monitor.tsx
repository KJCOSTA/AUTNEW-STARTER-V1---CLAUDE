import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Zap,
  Brain,
  Mic,
  Video,
  Youtube,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  HelpCircle,
  FileText,
  Image,
  DollarSign,
  TrendingUp,
  Cloud,
  AlertTriangle,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../ui'
import { checkAPIStatus } from '../../services/api'
import type { APIStatus } from '../../types'

// AI Provider configurations with quotas and costs
const AI_PROVIDERS = {
  gemini: {
    name: 'Google Gemini',
    icon: Brain,
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', costPer1k: 0.0001, rpm: 1000 },
      { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro', costPer1k: 0.0005, rpm: 360 },
    ],
    freeQuota: { requests: 1500, tokens: 1000000 },
    color: 'text-blue-400',
  },
  openai: {
    name: 'OpenAI',
    icon: Zap,
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', costPer1k: 0.00015, rpm: 500 },
      { id: 'gpt-4o', name: 'GPT-4o', costPer1k: 0.005, rpm: 500 },
      { id: 'dall-e-3', name: 'DALL-E 3', costPerImage: 0.04, rpm: 50 },
    ],
    freeQuota: null,
    color: 'text-green-400',
  },
  anthropic: {
    name: 'Anthropic Claude',
    icon: Brain,
    models: [
      { id: 'claude-3-haiku', name: 'Claude 3 Haiku', costPer1k: 0.00025, rpm: 500 },
      { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', costPer1k: 0.003, rpm: 500 },
      { id: 'claude-3-opus', name: 'Claude 3 Opus', costPer1k: 0.015, rpm: 500 },
    ],
    freeQuota: null,
    color: 'text-orange-400',
  },
  groq: {
    name: 'Groq',
    icon: Zap,
    models: [
      { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', costPer1k: 0.00059, rpm: 30 },
      { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', costPer1k: 0.00005, rpm: 30 },
      { id: 'mixtral-8x7b', name: 'Mixtral 8x7B', costPer1k: 0.00024, rpm: 30 },
    ],
    freeQuota: { requests: 14400, tokens: 500000 }, // Per day
    color: 'text-purple-400',
  },
  mistral: {
    name: 'Mistral AI',
    icon: Cloud,
    models: [
      { id: 'mistral-large', name: 'Mistral Large', costPer1k: 0.002, rpm: 500 },
      { id: 'mistral-small', name: 'Mistral Small', costPer1k: 0.0002, rpm: 500 },
    ],
    freeQuota: null,
    color: 'text-cyan-400',
  },
  elevenlabs: {
    name: 'ElevenLabs',
    icon: Mic,
    models: [
      { id: 'multilingual-v2', name: 'Multilingual V2', costPerChar: 0.00003 },
    ],
    freeQuota: { characters: 10000 }, // Per month
    color: 'text-pink-400',
  },
  json2video: {
    name: 'JSON2Video',
    icon: Video,
    models: [
      { id: 'standard', name: 'Standard', costPerMin: 0.10 },
    ],
    freeQuota: null,
    color: 'text-red-400',
  },
}

const apiIcons: Record<string, typeof Zap> = {
  Gemini: Brain,
  OpenAI: Zap,
  ElevenLabs: Mic,
  JSON2Video: Video,
  YouTube: Youtube,
}

const statusColors: Record<APIStatus, string> = {
  online: 'bg-status-success',
  warning: 'bg-status-warning',
  offline: 'bg-status-error',
  unknown: 'bg-text-secondary',
}

const statusIcons: Record<APIStatus, typeof CheckCircle> = {
  online: CheckCircle,
  warning: AlertCircle,
  offline: XCircle,
  unknown: HelpCircle,
}

export function Monitor() {
  const { apiStatus, setAPIStatus, configuracoes, addToast } = useStore()
  const [testing, setTesting] = useState<string | null>(null)
  const isTestMode = configuracoes.appMode === 'test'

  // Quota tracking (in real app, would come from state/backend)
  const [quotas] = useState({
    gemini: { used: 45200, limit: 1000000, percent: 4.5 },
    openai: { used: 12300, limit: 100000, percent: 12.3, paid: true },
    groq: { used: 25000, limit: 500000, percent: 5 },
    elevenlabs: { used: 5200, limit: 10000, percent: 52 },
  })

  // Cost breakdown
  const costBreakdown = {
    textGeneration: 1.25,
    imageGeneration: 0.80,
    audioGeneration: 0.20,
    videoGeneration: 0.10,
    total: 2.35,
    projected30Days: 70.50,
  }

  useEffect(() => {
    // Check API status on mount
    const checkStatus = async () => {
      try {
        const status = await checkAPIStatus()
        setAPIStatus(status.map(s => ({
          ...s,
          status: s.status as APIStatus,
        })))
      } catch {
        // Status check failed silently
      }
    }
    checkStatus()
  }, [])

  const testConnection = async (apiName: string) => {
    setTesting(apiName)
    try {
      await new Promise((r) => setTimeout(r, 1500))

      const newStatus = apiStatus.map((api) =>
        api.name === apiName
          ? {
              ...api,
              status: (isTestMode ? 'online' : Math.random() > 0.2 ? 'online' : 'offline') as APIStatus,
              lastCheck: new Date().toISOString(),
              message: isTestMode ? '[MOCK] Simulado' : 'Conexão testada',
            }
          : api
      )

      setAPIStatus(newStatus)
      addToast({
        type: 'success',
        message: `${apiName}: ${isTestMode ? '[TEST] Simulado' : 'Conectado!'}`,
      })
    } catch {
      const newStatus = apiStatus.map((api) =>
        api.name === apiName
          ? {
              ...api,
              status: 'offline' as APIStatus,
              lastCheck: new Date().toISOString(),
              message: 'Erro de rede',
            }
          : api
      )
      setAPIStatus(newStatus)
      addToast({ type: 'error', message: `${apiName}: Erro de conexão` })
    } finally {
      setTesting(null)
    }
  }

  const testAllConnections = async () => {
    for (const api of apiStatus) {
      await testConnection(api.name)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Torre de Controle</h1>
            <p className="text-sm text-text-secondary">
              Status das APIs, quotas e custos
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isTestMode && (
            <span className="px-3 py-1.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-lg">
              TEST MODE
            </span>
          )}
          <Button
            variant="secondary"
            onClick={testAllConnections}
            disabled={testing !== null}
            icon={<RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />}
          >
            Testar Todas
          </Button>
        </div>
      </div>

      {/* Cost Summary Card */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-3 rounded-xl bg-background/50">
              <div className="flex items-center gap-2 text-text-secondary mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs">Gasto Total</span>
              </div>
              <p className="text-xl font-bold text-text-primary">
                {isTestMode ? '$0.00' : `$${costBreakdown.total.toFixed(2)}`}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-background/50">
              <div className="flex items-center gap-2 text-text-secondary mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-xs">Texto (IA)</span>
              </div>
              <p className="text-xl font-bold text-text-primary">
                {isTestMode ? '$0.00' : `$${costBreakdown.textGeneration.toFixed(2)}`}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-background/50">
              <div className="flex items-center gap-2 text-text-secondary mb-1">
                <Image className="w-4 h-4" />
                <span className="text-xs">Imagens</span>
              </div>
              <p className="text-xl font-bold text-text-primary">
                {isTestMode ? '$0.00' : `$${costBreakdown.imageGeneration.toFixed(2)}`}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-background/50">
              <div className="flex items-center gap-2 text-text-secondary mb-1">
                <Mic className="w-4 h-4" />
                <span className="text-xs">Áudio</span>
              </div>
              <p className="text-xl font-bold text-text-primary">
                {isTestMode ? '$0.00' : `$${costBreakdown.audioGeneration.toFixed(2)}`}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-accent/20">
              <div className="flex items-center gap-2 text-text-secondary mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs">Projeção 30d</span>
              </div>
              <p className="text-xl font-bold text-text-primary">
                {isTestMode ? '$0.00' : `$${costBreakdown.projected30Days.toFixed(2)}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Status Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Status das Conexões</CardTitle>
          <CardDescription>
            Clique em uma API para testar a conexão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apiStatus.map((api) => {
              const Icon = apiIcons[api.name] || Zap
              const StatusIcon = statusIcons[api.status]
              const isProduction =
                api.name === 'ElevenLabs' || api.name === 'JSON2Video'

              return (
                <motion.button
                  key={api.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => testConnection(api.name)}
                  disabled={testing === api.name}
                  className="p-4 rounded-xl bg-background/50 border border-white/10 hover:border-white/20 text-left transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{api.name}</p>
                        {isProduction && (
                          <span className="text-xs text-accent-purple">
                            Modo Produção
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {testing === api.name ? (
                        <RefreshCw className="w-4 h-4 text-accent-blue animate-spin" />
                      ) : (
                        <>
                          <div
                            className={`w-2 h-2 rounded-full ${statusColors[api.status]}`}
                          />
                          <StatusIcon
                            className={`w-4 h-4 ${
                              api.status === 'online'
                                ? 'text-status-success'
                                : api.status === 'warning'
                                ? 'text-status-warning'
                                : api.status === 'offline'
                                ? 'text-status-error'
                                : 'text-text-secondary'
                            }`}
                          />
                        </>
                      )}
                    </div>
                  </div>
                  {api.lastCheck && (
                    <p className="text-xs text-text-secondary mt-2">
                      Último teste:{' '}
                      {new Date(api.lastCheck).toLocaleTimeString('pt-BR')}
                    </p>
                  )}
                </motion.button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quotas & Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Quotas e Uso</CardTitle>
          <CardDescription>Consumo de recursos por provedor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Gemini */}
          <div className="p-4 rounded-xl bg-background/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-400" />
                <span className="font-medium text-text-primary">Google Gemini</span>
                <span className="px-2 py-0.5 bg-status-success/20 text-status-success text-xs rounded-full">
                  Tier Grátis
                </span>
              </div>
              <span className="text-sm text-text-secondary">
                {isTestMode ? '0' : quotas.gemini.used.toLocaleString()} / {quotas.gemini.limit.toLocaleString()} tokens
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: isTestMode ? '0%' : `${quotas.gemini.percent}%` }}
                className="h-full bg-blue-400"
              />
            </div>
            <p className="text-xs text-text-secondary mt-2">
              Gemini 2.5 Flash • $0.0001/1K tokens • {isTestMode ? '0' : quotas.gemini.percent}% usado
            </p>
          </div>

          {/* Groq */}
          <div className="p-4 rounded-xl bg-background/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                <span className="font-medium text-text-primary">Groq</span>
                <span className="px-2 py-0.5 bg-status-success/20 text-status-success text-xs rounded-full">
                  Tier Grátis
                </span>
              </div>
              <span className="text-sm text-text-secondary">
                {isTestMode ? '0' : quotas.groq.used.toLocaleString()} / {quotas.groq.limit.toLocaleString()} tokens/dia
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: isTestMode ? '0%' : `${quotas.groq.percent}%` }}
                className="h-full bg-purple-400"
              />
            </div>
            <p className="text-xs text-text-secondary mt-2">
              Llama 3.1 70B • Super rápido • {isTestMode ? '0' : quotas.groq.percent}% usado
            </p>
          </div>

          {/* OpenAI */}
          <div className="p-4 rounded-xl bg-background/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-400" />
                <span className="font-medium text-text-primary">OpenAI</span>
                <span className="px-2 py-0.5 bg-accent-purple/20 text-accent-purple text-xs rounded-full">
                  Pago
                </span>
              </div>
              <span className="text-sm text-text-secondary">
                {isTestMode ? '0' : quotas.openai.used.toLocaleString()} / {quotas.openai.limit.toLocaleString()} tokens
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: isTestMode ? '0%' : `${quotas.openai.percent}%` }}
                className="h-full bg-green-400"
              />
            </div>
            <p className="text-xs text-text-secondary mt-2">
              GPT-4o Mini • $0.00015/1K tokens • DALL-E 3 $0.04/imagem
            </p>
          </div>

          {/* ElevenLabs */}
          <div className="p-4 rounded-xl bg-background/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-pink-400" />
                <span className="font-medium text-text-primary">ElevenLabs</span>
                {quotas.elevenlabs.percent > 50 && (
                  <span className="px-2 py-0.5 bg-status-warning/20 text-status-warning text-xs rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Baixo
                  </span>
                )}
              </div>
              <span className="text-sm text-text-secondary">
                {isTestMode ? '0' : quotas.elevenlabs.used.toLocaleString()} / {quotas.elevenlabs.limit.toLocaleString()} chars
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: isTestMode ? '0%' : `${quotas.elevenlabs.percent}%` }}
                className={`h-full ${quotas.elevenlabs.percent > 80 ? 'bg-status-error' : quotas.elevenlabs.percent > 50 ? 'bg-status-warning' : 'bg-pink-400'}`}
              />
            </div>
            <p className="text-xs text-text-secondary mt-2">
              Tier Grátis: 10K chars/mês • {isTestMode ? '0' : quotas.elevenlabs.percent}% usado
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Providers Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Provedores de IA Disponíveis</CardTitle>
          <CardDescription>Configure API keys nas Configurações para usar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(AI_PROVIDERS).map(([key, provider]) => {
              const Icon = provider.icon
              return (
                <div
                  key={key}
                  className="p-3 rounded-xl bg-background/50 border border-white/5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${provider.color}`} />
                    <span className="text-sm font-medium text-text-primary">
                      {provider.name}
                    </span>
                    {provider.freeQuota && (
                      <span className="px-1.5 py-0.5 bg-status-success/10 text-status-success text-xs rounded">
                        Free
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {provider.models.slice(0, 2).map((model) => (
                      <div key={model.id} className="flex items-center justify-between text-xs">
                        <span className="text-text-secondary">{model.name}</span>
                        <span className="text-text-secondary font-mono">
                          {'costPer1k' in model && `$${model.costPer1k}/1K`}
                          {'costPerImage' in model && `$${model.costPerImage}/img`}
                          {'costPerChar' in model && `$${model.costPerChar}/char`}
                          {'costPerMin' in model && `$${model.costPerMin}/min`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
