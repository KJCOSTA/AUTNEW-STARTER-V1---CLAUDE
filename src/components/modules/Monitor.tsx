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
  Claude: Brain,
  ElevenLabs: Mic,
  'Edge TTS': Mic,
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

  // API key mapping for checking configuration
  const apiKeyMapping: Record<string, keyof typeof configuracoes.apiKeys> = {
    Gemini: 'gemini',
    OpenAI: 'openai',
    Claude: 'anthropic',
    ElevenLabs: 'elevenlabs',
    JSON2Video: 'json2video',
    Groq: 'groq',
  }

  // Check if API key is configured
  const isApiKeyConfigured = (apiName: string): boolean => {
    const keyName = apiKeyMapping[apiName]
    if (!keyName) return true // APIs without keys (Edge TTS, YouTube)
    const key = configuracoes.apiKeys[keyName]
    return !!key && key.trim().length > 0
  }

  // Get specific error message with solution
  const getErrorMessageWithSolution = (apiName: string, errorType: string, details?: string): string => {
    const solutions: Record<string, Record<string, string>> = {
      Gemini: {
        'no-key': 'API Key não configurada. Vá em Configurações > API Keys > Gemini',
        'invalid-key': 'API Key inválida. Verifique em aistudio.google.com',
        'quota-exceeded': 'Quota excedida. Aguarde ou atualize seu plano',
        'network': 'Erro de rede. Verifique sua conexão',
      },
      OpenAI: {
        'no-key': 'API Key não configurada. Vá em Configurações > API Keys > OpenAI',
        'invalid-key': 'API Key inválida. Verifique em platform.openai.com',
        'quota-exceeded': 'Créditos insuficientes. Adicione créditos em OpenAI',
        'network': 'Erro de rede. Verifique sua conexão',
      },
      Claude: {
        'no-key': 'API Key não configurada. Vá em Configurações > API Keys > Anthropic',
        'invalid-key': 'API Key inválida. Verifique em console.anthropic.com',
        'quota-exceeded': 'Quota excedida. Verifique seu plano',
        'network': 'Erro de rede. Verifique sua conexão',
      },
      ElevenLabs: {
        'no-key': 'API Key não configurada. Vá em Configurações > API Keys > ElevenLabs',
        'invalid-key': 'API Key inválida. Verifique em elevenlabs.io',
        'quota-exceeded': 'Caracteres esgotados. Aguarde renovação mensal',
        'network': 'Erro de rede. Verifique sua conexão',
      },
      'Edge TTS': {
        'network': 'Serviço indisponível. Tente novamente em alguns minutos',
        'default': 'Edge TTS é gratuito e não requer API Key',
      },
      JSON2Video: {
        'no-key': 'API Key não configurada. Vá em Configurações > API Keys > JSON2Video',
        'invalid-key': 'API Key inválida. Verifique em json2video.com',
        'quota-exceeded': 'Créditos insuficientes. Recarregue em json2video.com',
        'network': 'Erro de rede. Verifique sua conexão',
      },
      YouTube: {
        'not-connected': 'YouTube não conectado. Vá em Configurações > Conexões',
        'network': 'Erro de rede. Verifique sua conexão',
      },
    }

    const apiSolutions = solutions[apiName] || {}
    let message = apiSolutions[errorType] || apiSolutions['default'] || `Erro: ${details || errorType}`

    return message
  }

  // Real API test functions
  const testRealAPI = async (apiName: string): Promise<{ success: boolean; message: string; action?: string }> => {
    // First check if API key is configured (for APIs that need it)
    if (!isApiKeyConfigured(apiName)) {
      return {
        success: false,
        message: getErrorMessageWithSolution(apiName, 'no-key'),
        action: 'configure-key'
      }
    }

    const apiEndpoints: Record<string, { url: string; body: object }> = {
      Gemini: {
        url: '/api/gemini',
        body: { action: 'test-connection' }
      },
      OpenAI: {
        url: '/api/openai',
        body: { action: 'test-connection' }
      },
      Claude: {
        url: '/api/claude',
        body: { action: 'test-connection' }
      },
      ElevenLabs: {
        url: '/api/elevenlabs',
        body: { action: 'test-connection' }
      },
      'Edge TTS': {
        url: '/api/edge-tts',
        body: { action: 'test-connection' }
      },
      JSON2Video: {
        url: '/api/json2video',
        body: { action: 'test-connection' }
      },
      YouTube: {
        url: '/api/youtube/status',
        body: {}
      },
    }

    const endpoint = apiEndpoints[apiName]
    if (!endpoint) {
      return { success: false, message: `API ${apiName} não suportada` }
    }

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(endpoint.body),
      })

      const data = await response.json()

      if (response.ok) {
        // Check for specific success indicators
        if (data.success === true || data.status === 'ok' || data.connected === true) {
          return { success: true, message: data.message || 'Conectado com sucesso!' }
        }
        // Check for configuration needed
        if (data.needsConfiguration || data.configured === false) {
          return {
            success: false,
            message: getErrorMessageWithSolution(apiName, 'no-key'),
            action: 'configure-key'
          }
        }
        // Default success if response is OK
        return { success: true, message: 'API respondendo!' }
      } else {
        // Parse specific error types
        const errorCode = data.code || data.error?.code || ''
        const errorMessage = data.error || data.message || ''

        if (errorCode.includes('invalid') || errorMessage.toLowerCase().includes('invalid') ||
            errorMessage.toLowerCase().includes('unauthorized') || response.status === 401) {
          return {
            success: false,
            message: getErrorMessageWithSolution(apiName, 'invalid-key'),
            action: 'check-key'
          }
        }

        if (errorCode.includes('quota') || errorMessage.toLowerCase().includes('quota') ||
            errorMessage.toLowerCase().includes('limit') || response.status === 429) {
          return {
            success: false,
            message: getErrorMessageWithSolution(apiName, 'quota-exceeded'),
            action: 'check-quota'
          }
        }

        return {
          success: false,
          message: `Erro: ${errorMessage || `HTTP ${response.status}`}`,
        }
      }
    } catch (error) {
      return {
        success: false,
        message: getErrorMessageWithSolution(apiName, 'network'),
        action: 'check-network'
      }
    }
  }

  const testConnection = async (apiName: string) => {
    setTesting(apiName)
    try {
      let result: { success: boolean; message: string }

      if (isTestMode) {
        // In test mode, just simulate
        await new Promise((r) => setTimeout(r, 800))
        result = { success: true, message: '[TEST] Simulado com sucesso' }
      } else {
        // Real API test
        result = await testRealAPI(apiName)
      }

      const newStatus = apiStatus.map((api) =>
        api.name === apiName
          ? {
              ...api,
              status: (result.success ? 'online' : 'offline') as APIStatus,
              lastCheck: new Date().toISOString(),
              message: result.message,
            }
          : api
      )

      setAPIStatus(newStatus)
      addToast({
        type: result.success ? 'success' : 'error',
        message: `${apiName}: ${result.message}`,
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
                {isTestMode ? `$${costBreakdown.total.toFixed(2)}` : '$0.00'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-background/50">
              <div className="flex items-center gap-2 text-text-secondary mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-xs">Texto (IA)</span>
              </div>
              <p className="text-xl font-bold text-text-primary">
                {isTestMode ? `$${costBreakdown.textGeneration.toFixed(2)}` : '$0.00'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-background/50">
              <div className="flex items-center gap-2 text-text-secondary mb-1">
                <Image className="w-4 h-4" />
                <span className="text-xs">Imagens</span>
              </div>
              <p className="text-xl font-bold text-text-primary">
                {isTestMode ? `$${costBreakdown.imageGeneration.toFixed(2)}` : '$0.00'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-background/50">
              <div className="flex items-center gap-2 text-text-secondary mb-1">
                <Mic className="w-4 h-4" />
                <span className="text-xs">Áudio</span>
              </div>
              <p className="text-xl font-bold text-text-primary">
                {isTestMode ? `$${costBreakdown.audioGeneration.toFixed(2)}` : '$0.00'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-accent/20">
              <div className="flex items-center gap-2 text-text-secondary mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs">Projeção 30d</span>
              </div>
              <p className="text-xl font-bold text-text-primary">
                {isTestMode ? `$${costBreakdown.projected30Days.toFixed(2)}` : '$0.00'}
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
              const isAutoWorkflow =
                api.name === 'ElevenLabs' || api.name === 'JSON2Video'
              const hasApiKey = isApiKeyConfigured(api.name)
              const needsKey = apiKeyMapping[api.name] !== undefined

              return (
                <motion.button
                  key={api.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => testConnection(api.name)}
                  disabled={testing === api.name}
                  className={`p-4 rounded-xl bg-background/50 border text-left transition-all ${
                    !hasApiKey && needsKey
                      ? 'border-status-warning/30 hover:border-status-warning/50'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        !hasApiKey && needsKey ? 'bg-status-warning/10' : 'bg-white/5'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          !hasApiKey && needsKey ? 'text-status-warning' : 'text-text-secondary'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{api.name}</p>
                        {!hasApiKey && needsKey ? (
                          <span className="text-xs text-status-warning flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            API Key não configurada
                          </span>
                        ) : isAutoWorkflow ? (
                          <span className="text-xs text-accent-purple">
                            Workflow Automático
                          </span>
                        ) : null}
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
                {isTestMode ? quotas.gemini.used.toLocaleString() : '0'} / {quotas.gemini.limit.toLocaleString()} tokens
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: isTestMode ? `${quotas.gemini.percent}%` : '0%' }}
                className="h-full bg-blue-400"
              />
            </div>
            <p className="text-xs text-text-secondary mt-2">
              Gemini 2.5 Flash • $0.0001/1K tokens • {isTestMode ? quotas.gemini.percent : '0'}% usado
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
                {isTestMode ? quotas.groq.used.toLocaleString() : '0'} / {quotas.groq.limit.toLocaleString()} tokens/dia
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: isTestMode ? `${quotas.groq.percent}%` : '0%' }}
                className="h-full bg-purple-400"
              />
            </div>
            <p className="text-xs text-text-secondary mt-2">
              Llama 3.1 70B • Super rápido • {isTestMode ? quotas.groq.percent : '0'}% usado
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
                {isTestMode ? quotas.openai.used.toLocaleString() : '0'} / {quotas.openai.limit.toLocaleString()} tokens
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: isTestMode ? `${quotas.openai.percent}%` : '0%' }}
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
                {isTestMode && quotas.elevenlabs.percent > 50 && (
                  <span className="px-2 py-0.5 bg-status-warning/20 text-status-warning text-xs rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Baixo
                  </span>
                )}
              </div>
              <span className="text-sm text-text-secondary">
                {isTestMode ? quotas.elevenlabs.used.toLocaleString() : '0'} / {quotas.elevenlabs.limit.toLocaleString()} chars
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: isTestMode ? `${quotas.elevenlabs.percent}%` : '0%' }}
                className={`h-full ${isTestMode && quotas.elevenlabs.percent > 80 ? 'bg-status-error' : isTestMode && quotas.elevenlabs.percent > 50 ? 'bg-status-warning' : 'bg-pink-400'}`}
              />
            </div>
            <p className="text-xs text-text-secondary mt-2">
              Tier Grátis: 10K chars/mês • {isTestMode ? quotas.elevenlabs.percent : '0'}% usado
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
