import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings,
  Key,
  Youtube,
  User,
  Zap,
  Eye,
  EyeOff,
  CheckCircle,
  ExternalLink,
  Save,
  Plus,
  X,
  HardDrive,
  Trash2,
  Bot,
  Edit3,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Star,
  DollarSign,
  FileText,
  Image,
  Mic,
  Video,
  Upload,
  Sliders,
  FlaskConical,
  ShieldAlert,
  Lock,
  Loader2,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useAuth } from '../../contexts/AuthContext'
import {
  Button,
  Input,
  Toggle,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  HealthCheckModal,
} from '../ui'
import type {
  OperationMode,
  APIKeyConfig,
  CustomModeConfig,
  RoteiroOption,
  TituloSeoOption,
  ThumbnailOption,
  NarracaoOption,
  VideoOption,
  UploadOption,
} from '../../types'

// All available API providers
const ALL_API_PROVIDERS = [
  { key: 'gemini', label: 'Google Gemini', tipo: 'api-key' as const, url: 'ai.google.dev' },
  { key: 'openai', label: 'OpenAI', tipo: 'api-key' as const, url: 'platform.openai.com' },
  { key: 'anthropic', label: 'Anthropic (Claude)', tipo: 'api-key' as const, url: 'console.anthropic.com' },
  { key: 'elevenlabs', label: 'ElevenLabs', tipo: 'api-key' as const, url: 'elevenlabs.io' },
  { key: 'json2video', label: 'JSON2Video', tipo: 'api-key' as const, url: 'json2video.com' },
  { key: 'groq', label: 'Groq', tipo: 'api-key' as const, url: 'console.groq.com' },
  { key: 'mistral', label: 'Mistral AI', tipo: 'api-key' as const, url: 'console.mistral.ai' },
  { key: 'stabilityai', label: 'Stability AI', tipo: 'api-key' as const, url: 'stability.ai' },
  { key: 'replicate', label: 'Replicate', tipo: 'api-key' as const, url: 'replicate.com' },
  { key: 'pexels', label: 'Pexels', tipo: 'api-key' as const, url: 'pexels.com/api' },
  { key: 'pixabay', label: 'Pixabay', tipo: 'api-key' as const, url: 'pixabay.com/api' },
]

const OAUTH_PROVIDERS = [
  { key: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-500' },
  { key: 'googleDrive', label: 'Google Drive', icon: HardDrive, color: 'text-blue-400' },
]

// Cost estimates per option
const COSTS = {
  roteiro: {
    gemini: 0,
    gpt4: 0.02,
    claude: 0.015, // Claude 3.5 Sonnet - melhor qualidade
    manual: 0,
  },
  tituloSeo: {
    gemini: 0,
    gpt4: 0.01,
    claude: 0.008,
  },
  thumbnail: {
    'dalle-standard': 0.04,
    'dalle-hd': 0.08,
    unsplash: 0, // FREE
    pexels: 0, // FREE
    manual: 0,
  },
  narracao: {
    'elevenlabs-multilingual': 0.30, // ~6 min video
    'elevenlabs-turbo': 0.12,
    'edge-tts': 0, // FREE - Microsoft Neural Voices
    manual: 0,
    'capcut-tts': 0,
  },
  video: {
    json2video: 2.40, // ~6 min video
    capcut: 0,
    remotion: 0,
  },
  upload: {
    'youtube-api': 0,
    manual: 0,
  },
  // Media sources for scenes
  media: {
    pexels: 0, // FREE
    pixabay: 0, // FREE
    unsplash: 0, // FREE
    dalle: 0.04,
    runway: 3.00, // per 5 second clip
  },
}

// Pre-defined modes
const PREDEFINED_MODES = [
  {
    id: 'smart-economy' as OperationMode,
    nome: 'Smart Economy',
    custo: '$3-8/vídeo',
    indicador: '⚡ Recomendado - Economia inteligente com qualidade',
    recomendado: true,
    config: {
      roteiro: 'Gemini (grátis)',
      thumbnail: 'Unsplash/Pexels (grátis) + DALL-E',
      narracao: 'Edge TTS (grátis) ou ElevenLabs',
      video: 'Pexels/Pixabay (grátis) → JSON2Video',
    },
    description: 'Busca recursos gratuitos primeiro. Até 95% de economia.',
  },
  {
    id: 'mvp' as OperationMode,
    nome: 'MVP Gratuito',
    custo: '$0/mês',
    indicador: 'Totalmente gratuito, montagem manual',
    recomendado: false,
    config: {
      roteiro: 'Gemini (grátis)',
      thumbnail: 'DALL-E (~$0.08 cada)',
      narracao: 'Manual (você grava no CapCut)',
      video: 'Manual (você monta no CapCut)',
    },
  },
  {
    id: 'producao' as OperationMode,
    nome: 'Automação Completa',
    custo: '$10-15/mês',
    indicador: 'Vídeo pronto automaticamente',
    recomendado: false,
    config: {
      roteiro: 'Gemini (grátis)',
      thumbnail: 'DALL-E (~$0.08 cada)',
      narracao: 'ElevenLabs (automático)',
      video: 'JSON2Video (renderização automática)',
    },
  },
  {
    id: 'full-ai' as OperationMode,
    nome: 'Full AI Premium',
    custo: '$40-60/vídeo',
    indicador: 'Máxima qualidade, tudo gerado por IA',
    recomendado: false,
    config: {
      roteiro: 'Gemini + refinamento GPT-4',
      thumbnail: 'DALL-E HD',
      narracao: 'ElevenLabs (voz premium)',
      video: 'Runway + JSON2Video (100% IA)',
    },
  },
]

export function Configuracoes() {
  const { configuracoes, setConfiguracoes, addToast } = useStore()
  const { verifyProductionPassword, isAdmin } = useAuth()
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [testing, setTesting] = useState<string | null>(null)
  const [showAddApiModal, setShowAddApiModal] = useState(false)
  const [showEditApiModal, setShowEditApiModal] = useState(false)
  const [editingApiKey, setEditingApiKey] = useState<{ key: string; label: string; value: string } | null>(null)
  const [newApiKey, setNewApiKey] = useState<Partial<APIKeyConfig>>({ nome: '', key: '', tipo: 'api-key' })

  // Custom mode modal state
  const [showCustomModeModal, setShowCustomModeModal] = useState(false)
  const [showTestModeConfirm, setShowTestModeConfirm] = useState(false)
  const [showHealthCheckModal, setShowHealthCheckModal] = useState(false)

  // Production password verification state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [productionPassword, setProductionPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [verifyingPassword, setVerifyingPassword] = useState(false)
  const [customModeConfig, setCustomModeConfig] = useState<CustomModeConfig>({
    nome: 'Meu Modo Personalizado',
    roteiro: 'gemini',
    tituloSeo: 'gemini',
    thumbnail: 'dalle-standard',
    narracao: 'elevenlabs-turbo',
    video: 'json2video',
    upload: 'youtube-api',
  })

  const toggleShowKey = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Calculate cost for custom mode
  const calculateCustomModeCost = (config: CustomModeConfig) => {
    const perVideo =
      COSTS.roteiro[config.roteiro] +
      COSTS.tituloSeo[config.tituloSeo] +
      COSTS.thumbnail[config.thumbnail] +
      COSTS.narracao[config.narracao] +
      COSTS.video[config.video] +
      COSTS.upload[config.upload]

    return {
      perVideo: perVideo.toFixed(2),
      monthly: (perVideo * 20).toFixed(2),
    }
  }

  // Handle Google Drive connection
  const handleGoogleDriveConnect = () => {
    addToast({ type: 'info', message: 'Conectando ao Google Drive...' })
    setConfiguracoes({
      googleDrive: { conectado: true }
    })
    addToast({ type: 'success', message: 'Google Drive conectado!' })
  }

  // Handle adding custom API key
  const handleAddCustomApiKey = () => {
    if (!newApiKey.nome || !newApiKey.key) {
      addToast({ type: 'warning', message: 'Nome e chave são obrigatórios' })
      return
    }

    const customKey: APIKeyConfig = {
      key: newApiKey.key,
      nome: newApiKey.nome,
      tipo: newApiKey.tipo || 'api-key',
    }

    setConfiguracoes({
      apiKeysCustom: [...(configuracoes.apiKeysCustom || []), customKey]
    })
    setNewApiKey({ nome: '', key: '', tipo: 'api-key' })
    setShowAddApiModal(false)
    addToast({ type: 'success', message: 'API Key adicionada!' })
  }

  // Handle removing custom API key
  const handleRemoveCustomApiKey = (nome: string) => {
    setConfiguracoes({
      apiKeysCustom: (configuracoes.apiKeysCustom || []).filter(k => k.nome !== nome)
    })
    addToast({ type: 'info', message: 'API Key removida' })
  }

  // Handle toggling API key active state
  const handleToggleApiKey = (keyName: string) => {
    const currentState = configuracoes.apiKeysAtivo?.[keyName] ?? true
    setConfiguracoes({
      apiKeysAtivo: {
        ...(configuracoes.apiKeysAtivo || {}),
        [keyName]: !currentState
      }
    })
    addToast({
      type: 'info',
      message: `${keyName}: ${!currentState ? 'Ativada' : 'Desativada'}`
    })
  }

  // Handle toggling custom API key active state
  const handleToggleCustomApiKey = (nome: string) => {
    const updated = (configuracoes.apiKeysCustom || []).map(k =>
      k.nome === nome ? { ...k, ativo: !(k.ativo ?? true) } : k
    )
    setConfiguracoes({ apiKeysCustom: updated })
    const key = updated.find(k => k.nome === nome)
    addToast({
      type: 'info',
      message: `${nome}: ${key?.ativo ? 'Ativada' : 'Desativada'}`
    })
  }

  // Handle editing built-in API key
  const handleEditApiKey = (keyName: string, label: string) => {
    const currentValue = configuracoes.apiKeys[keyName as keyof typeof configuracoes.apiKeys] || ''
    setEditingApiKey({ key: keyName, label, value: currentValue })
    setShowEditApiModal(true)
  }

  // Handle saving edited API key
  const handleSaveEditedApiKey = () => {
    if (!editingApiKey) return
    setConfiguracoes({
      apiKeys: {
        ...configuracoes.apiKeys,
        [editingApiKey.key]: editingApiKey.value
      }
    })
    setShowEditApiModal(false)
    setEditingApiKey(null)
    addToast({ type: 'success', message: 'API Key atualizada!' })
  }

  // Handle removing built-in API key
  const handleRemoveBuiltInApiKey = (keyName: string) => {
    setConfiguracoes({
      apiKeys: {
        ...configuracoes.apiKeys,
        [keyName]: ''
      }
    })
    addToast({ type: 'info', message: 'API Key removida' })
  }

  // Handle editing custom API key
  const handleEditCustomApiKey = (nome: string, newKey: string) => {
    const updated = (configuracoes.apiKeysCustom || []).map(k =>
      k.nome === nome ? { ...k, key: newKey } : k
    )
    setConfiguracoes({ apiKeysCustom: updated })
    addToast({ type: 'success', message: 'API Key atualizada!' })
  }

  const testApiKey = async (keyName: string, apiKey: string) => {
    if (!apiKey) {
      addToast({ type: 'warning', message: 'Insira a API key primeiro' })
      return
    }

    setTesting(keyName)
    try {
      const endpoints: Record<string, string> = {
        gemini: '/api/gemini',
        openai: '/api/openai',
        elevenlabs: '/api/elevenlabs',
        json2video: '/api/json2video',
      }

      const response = await fetch(endpoints[keyName], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', apiKey }),
      })

      addToast({
        type: response.ok ? 'success' : 'error',
        message: response.ok
          ? `${keyName}: Conexão válida!`
          : `${keyName}: Chave inválida`,
      })
    } catch {
      addToast({ type: 'error', message: `Erro ao testar ${keyName}` })
    } finally {
      setTesting(null)
    }
  }

  const handleModeChange = (mode: OperationMode) => {
    // Check if production APIs are configured
    if (mode === 'producao' || mode === 'full-ai') {
      if (!configuracoes.apiKeys.elevenlabs || !configuracoes.apiKeys.json2video) {
        addToast({
          type: 'warning',
          message: 'Configure as API keys de ElevenLabs e JSON2Video para usar este modo',
        })
      }
    }

    setConfiguracoes({ modo: mode })

    const modeLabels: Record<OperationMode, string> = {
      'smart-economy': 'Smart Economy',
      'mvp': 'MVP Gratuito',
      'producao': 'Automação Completa',
      'full-ai': 'Full AI Premium',
      'custom': 'Modo Personalizado'
    }
    addToast({
      type: 'info',
      message: `Modo alterado para ${modeLabels[mode]}`,
    })
  }

  const handleSaveCustomMode = () => {
    setConfiguracoes({
      modo: 'custom',
      customMode: customModeConfig
    })
    setShowCustomModeModal(false)
    addToast({ type: 'success', message: 'Modo personalizado salvo!' })
  }

  const handleYouTubeConnect = () => {
    addToast({
      type: 'info',
      message: 'Redirecionando para autenticação do YouTube...',
    })
  }

  const handleSave = () => {
    addToast({ type: 'success', message: 'Configurações salvas!' })
  }

  const apiKeyFields = [
    {
      key: 'gemini',
      label: 'Google Gemini',
      description: 'Obtenha em ai.google.dev',
      required: true,
    },
    {
      key: 'openai',
      label: 'OpenAI',
      description: 'Obtenha em platform.openai.com',
      required: false,
    },
    {
      key: 'anthropic',
      label: 'Anthropic (Claude)',
      description: 'Obtenha em console.anthropic.com',
      required: false,
    },
    {
      key: 'elevenlabs',
      label: 'ElevenLabs',
      description: 'Obtenha em elevenlabs.io (Modo Produção)',
      required: false,
      production: true,
    },
    {
      key: 'json2video',
      label: 'JSON2Video',
      description: 'Obtenha em json2video.com (Modo Produção)',
      required: false,
      production: true,
    },
    {
      key: 'groq',
      label: 'Groq',
      description: 'Obtenha em console.groq.com (alta velocidade)',
      required: false,
    },
    {
      key: 'stabilityai',
      label: 'Stability AI',
      description: 'Obtenha em stability.ai (geração de imagens)',
      required: false,
    },
    {
      key: 'pexels',
      label: 'Pexels',
      description: 'Obtenha em pexels.com/api (stock videos/images)',
      required: false,
    },
  ]

  const customCosts = calculateCustomModeCost(customModeConfig)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Configurações</h1>
            <p className="text-sm text-text-secondary">
              API keys, conexões e personalização
            </p>
          </div>
        </div>
        <Button onClick={handleSave} icon={<Save className="w-4 h-4" />}>
          Salvar
        </Button>
      </div>

      {/* Operation Mode - NEW DESIGN */}
      <Card variant="gradient">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-accent-blue" />
            <div>
              <CardTitle>Modo de Operação</CardTitle>
              <CardDescription>
                Escolha como você quer produzir seus vídeos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pre-defined Modes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PREDEFINED_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`relative p-4 rounded-xl border text-left transition-all ${
                  configuracoes.modo === mode.id
                    ? mode.recomendado
                      ? 'border-status-success bg-status-success/10 ring-2 ring-status-success/50'
                      : 'border-accent-blue bg-accent-blue/10 ring-2 ring-accent-blue/50'
                    : mode.recomendado
                    ? 'border-status-success/50 hover:border-status-success hover:bg-status-success/5'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                {/* Recommended Badge */}
                {mode.recomendado && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-status-success text-white text-xs font-medium rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Recomendado
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-3 mt-1">
                  <h4 className="font-semibold text-text-primary">{mode.nome}</h4>
                  {configuracoes.modo === mode.id && (
                    <CheckCircle className={`w-5 h-5 ${mode.recomendado ? 'text-status-success' : 'text-accent-blue'}`} />
                  )}
                </div>

                {/* Cost */}
                <div className="flex items-center gap-1 mb-3">
                  <DollarSign className="w-4 h-4 text-status-warning" />
                  <span className="text-sm font-medium text-text-primary">{mode.custo}</span>
                </div>

                {/* Config Details */}
                <ul className="space-y-1.5 text-xs text-text-secondary mb-3">
                  <li className="flex items-start gap-2">
                    <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{mode.config.roteiro}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Image className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{mode.config.thumbnail}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Mic className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{mode.config.narracao}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Video className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{mode.config.video}</span>
                  </li>
                </ul>

                {/* Indicator */}
                <div className={`text-xs font-medium ${
                  mode.recomendado ? 'text-status-success' : 'text-text-secondary'
                }`}>
                  {mode.indicador}
                </div>
              </button>
            ))}
          </div>

          {/* Custom Mode Card (if saved) */}
          {configuracoes.customMode && (
            <button
              onClick={() => handleModeChange('custom')}
              className={`w-full p-4 rounded-xl border text-left transition-all ${
                configuracoes.modo === 'custom'
                  ? 'border-accent-purple bg-accent-purple/10 ring-2 ring-accent-purple/50'
                  : 'border-white/10 hover:border-accent-purple/50 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-accent-purple" />
                  <h4 className="font-semibold text-text-primary">
                    {configuracoes.customMode.nome}
                  </h4>
                  <span className="px-2 py-0.5 bg-accent-purple/20 text-accent-purple text-xs rounded">
                    Personalizado
                  </span>
                </div>
                {configuracoes.modo === 'custom' && (
                  <CheckCircle className="w-5 h-5 text-accent-purple" />
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-text-secondary">
                <span>~${calculateCustomModeCost(configuracoes.customMode).perVideo}/vídeo</span>
                <span>~${calculateCustomModeCost(configuracoes.customMode).monthly}/mês (20 vídeos)</span>
              </div>
            </button>
          )}

          {/* Create Custom Mode Button */}
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setShowCustomModeModal(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            {configuracoes.customMode ? 'Editar Modo Personalizado' : 'Criar Meu Próprio Modo'}
          </Button>

          {/* JSON2Video Watermark Option */}
          {(configuracoes.modo === 'producao' || configuracoes.modo === 'full-ai' || configuracoes.modo === 'custom') && (
            <div className="p-4 bg-background/50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-primary text-sm">JSON2Video Watermark</p>
                  <p className="text-xs text-text-secondary">
                    Use marca d'água para previews gratuitos, sem gastar créditos
                  </p>
                </div>
                <Toggle
                  checked={configuracoes.json2video?.useWatermark ?? true}
                  onChange={(checked) => setConfiguracoes({
                    json2video: { ...configuracoes.json2video, useWatermark: checked }
                  })}
                  label={configuracoes.json2video?.useWatermark ? 'Com Watermark' : 'Sem Watermark'}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-status-warning" />
              <div>
                <CardTitle>Chaves de API</CardTitle>
                <CardDescription>
                  Configure suas credenciais de acesso
                </CardDescription>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowAddApiModal(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add API Key
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiKeyFields.map((field) => {
            const hasKey = !!configuracoes.apiKeys[field.key as keyof typeof configuracoes.apiKeys]
            const isActive = configuracoes.apiKeysAtivo?.[field.key] ?? true
            const isDisabled = field.production && configuracoes.modo === 'mvp'

            return (
              <div
                key={field.key}
                className={`p-4 rounded-xl border transition-all ${
                  isDisabled
                    ? 'border-white/5 opacity-50'
                    : !isActive && hasKey
                    ? 'border-status-warning/20 bg-status-warning/5'
                    : 'border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {/* Toggle Switch */}
                    {hasKey && !isDisabled && (
                      <button
                        onClick={() => handleToggleApiKey(field.key)}
                        className="flex-shrink-0"
                        title={isActive ? 'Desativar' : 'Ativar'}
                      >
                        {isActive ? (
                          <ToggleRight className="w-6 h-6 text-status-success" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-text-secondary" />
                        )}
                      </button>
                    )}
                    <div>
                      <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                        {field.label}
                        {field.required && (
                          <span className="text-status-error">*</span>
                        )}
                        {field.production && (
                          <span className="px-2 py-0.5 text-xs bg-accent-purple/20 text-accent-purple rounded">
                            Produção
                          </span>
                        )}
                        {!isActive && hasKey && (
                          <span className="px-2 py-0.5 text-xs bg-status-warning/20 text-status-warning rounded">
                            Desativada
                          </span>
                        )}
                      </label>
                      <p className="text-xs text-text-secondary">{field.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasKey && (
                      <>
                        <CheckCircle className="w-4 h-4 text-status-success" />
                        <button
                          onClick={() => handleEditApiKey(field.key, field.label)}
                          className="p-1.5 hover:bg-white/10 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveBuiltInApiKey(field.key)}
                          className="p-1.5 hover:bg-white/10 rounded-lg text-text-secondary hover:text-status-error transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      type={showKeys[field.key] ? 'text' : 'password'}
                      placeholder={`Cole sua ${field.label} API Key`}
                      value={
                        configuracoes.apiKeys[
                          field.key as keyof typeof configuracoes.apiKeys
                        ]
                      }
                      onChange={(e) =>
                        setConfiguracoes({
                          apiKeys: {
                            ...configuracoes.apiKeys,
                            [field.key]: e.target.value,
                          },
                        })
                      }
                      disabled={isDisabled}
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey(field.key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                    >
                      {showKeys[field.key] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      testApiKey(
                        field.key,
                        configuracoes.apiKeys[
                          field.key as keyof typeof configuracoes.apiKeys
                        ] || ''
                      )
                    }
                    loading={testing === field.key}
                    disabled={!hasKey || isDisabled || !isActive}
                  >
                    Testar
                  </Button>
                </div>
                {!isActive && hasKey && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-status-warning">
                    <AlertCircle className="w-3 h-3" />
                    <span>Esta API key está desativada e não será usada nas gerações</span>
                  </div>
                )}
              </div>
            )
          })}

          {/* Custom API Keys */}
          {configuracoes.apiKeysCustom && configuracoes.apiKeysCustom.length > 0 && (
            <>
              <div className="border-t border-white/10 pt-4 mt-4">
                <p className="text-sm font-medium text-text-primary mb-3">API Keys Personalizadas</p>
              </div>
              {configuracoes.apiKeysCustom.map((customKey) => {
                const isCustomActive = customKey.ativo ?? true
                return (
                  <div
                    key={customKey.nome}
                    className={`p-4 rounded-xl border transition-all ${
                      !isCustomActive
                        ? 'border-status-warning/20 bg-status-warning/5'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleCustomApiKey(customKey.nome)}
                          className="flex-shrink-0"
                          title={isCustomActive ? 'Desativar' : 'Ativar'}
                        >
                          {isCustomActive ? (
                            <ToggleRight className="w-6 h-6 text-status-success" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-text-secondary" />
                          )}
                        </button>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-text-primary">
                            {customKey.nome}
                          </label>
                          <span className="px-2 py-0.5 text-xs bg-accent-blue/20 text-accent-blue rounded">
                            Custom
                          </span>
                          {!isCustomActive && (
                            <span className="px-2 py-0.5 text-xs bg-status-warning/20 text-status-warning rounded">
                              Desativada
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingApiKey({ key: customKey.nome, label: customKey.nome, value: customKey.key })
                            setShowEditApiModal(true)
                          }}
                          className="p-1.5 hover:bg-white/10 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveCustomApiKey(customKey.nome)}
                          className="p-1.5 hover:bg-white/10 rounded-lg text-text-secondary hover:text-status-error transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          type={showKeys[customKey.nome] ? 'text' : 'password'}
                          value={customKey.key}
                          onChange={(e) => handleEditCustomApiKey(customKey.nome, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => toggleShowKey(customKey.nome)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                        >
                          {showKeys[customKey.nome] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    {!isCustomActive && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-status-warning">
                        <AlertCircle className="w-3 h-3" />
                        <span>Esta API key está desativada e não será usada nas gerações</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </CardContent>
      </Card>

      {/* YouTube Connection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Youtube className="w-5 h-5 text-red-500" />
            <div>
              <CardTitle>Conexão YouTube</CardTitle>
              <CardDescription>
                Conecte seu canal para publicação direta
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {configuracoes.youtube.conectado ? (
            <div className="flex items-center justify-between p-4 bg-status-success/10 border border-status-success/30 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-status-success" />
                <div>
                  <p className="font-medium text-text-primary">
                    {configuracoes.youtube.canalNome}
                  </p>
                  <p className="text-xs text-text-secondary">Canal conectado</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  Reconectar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setConfiguracoes({
                      youtube: { conectado: false, canalNome: '' },
                    })
                  }
                >
                  Desconectar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-4 border-b border-white/10">
                <Youtube className="w-10 h-10 mx-auto mb-3 text-text-secondary" />
                <p className="text-text-secondary text-sm mb-3">
                  Conecte seu canal para publicar vídeos diretamente
                </p>
                <Button
                  onClick={handleYouTubeConnect}
                  icon={<ExternalLink className="w-4 h-4" />}
                >
                  Conectar com YouTube
                </Button>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-text-primary">
                  Ou sincronize com Google Drive:
                </p>
                <button
                    onClick={handleGoogleDriveConnect}
                    className={`flex items-center gap-3 p-4 border rounded-xl transition-colors text-left ${
                      configuracoes.googleDrive?.conectado
                        ? 'border-status-success/30 bg-status-success/5'
                        : 'border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <HardDrive className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary text-sm">Google Drive</p>
                      <p className="text-xs text-text-secondary">
                        {configuracoes.googleDrive?.conectado
                          ? 'Conectado'
                          : 'Sincronize com sua pasta'}
                      </p>
                    </div>
                    {configuracoes.googleDrive?.conectado ? (
                      <CheckCircle className="w-4 h-4 text-status-success ml-auto" />
                    ) : (
                      <ExternalLink className="w-4 h-4 text-text-secondary ml-auto" />
                    )}
                  </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personalization */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-accent-blue" />
            <div>
              <CardTitle>Personalização</CardTitle>
              <CardDescription>
                Configurações do canal e identidade
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nome do Canal"
            value={configuracoes.personalizacao.nomeCanal}
            onChange={(e) =>
              setConfiguracoes({
                personalizacao: {
                  ...configuracoes.personalizacao,
                  nomeCanal: e.target.value,
                },
              })
            }
          />
          <Input
            label="Nicho de Conteúdo"
            value={configuracoes.personalizacao.nicho}
            onChange={(e) =>
              setConfiguracoes({
                personalizacao: {
                  ...configuracoes.personalizacao,
                  nicho: e.target.value,
                },
              })
            }
          />
          <Input
            label="Tom de Comunicação"
            value={configuracoes.personalizacao.tomComunicacao}
            onChange={(e) =>
              setConfiguracoes({
                personalizacao: {
                  ...configuracoes.personalizacao,
                  tomComunicacao: e.target.value,
                },
              })
            }
            hint="Ex: Acolhedor, suave, esperançoso"
          />
        </CardContent>
      </Card>

      {/* Development Mode Toggle */}
      <Card className="border-amber-500/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <FlaskConical className="w-5 h-5 text-amber-500" />
            <div>
              <CardTitle>Modo de Desenvolvimento</CardTitle>
              <CardDescription>
                Controle o uso de dados simulados vs APIs reais
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-white/10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (configuracoes.appMode === 'test') {
                      // Going to production - verify password first (admin only)
                      if (!isAdmin) {
                        addToast({ type: 'error', message: 'Apenas administradores podem ativar o modo produção' })
                        return
                      }
                      setShowPasswordModal(true)
                      setProductionPassword('')
                      setPasswordError('')
                    } else {
                      // Going to test mode - no confirmation needed
                      setConfiguracoes({ appMode: 'test' })
                      addToast({ type: 'info', message: 'Modo Teste ativado - dados simulados' })
                    }
                  }}
                  className="flex-shrink-0"
                >
                  {configuracoes.appMode === 'test' ? (
                    <ToggleRight className="w-8 h-8 text-amber-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-text-secondary" />
                  )}
                </button>
                <div>
                  <p className="font-medium text-text-primary">
                    Modo Teste (dados simulados)
                  </p>
                  <p className="text-xs text-text-secondary">
                    Quando ativo, não gasta créditos das APIs
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                configuracoes.appMode === 'test'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-status-success/20 text-status-success'
              }`}>
                {configuracoes.appMode === 'test' ? 'TESTE' : 'PRODUÇÃO'}
              </span>
            </div>

            {/* Info based on mode */}
            {configuracoes.appMode === 'test' ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <FlaskConical className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-400 mb-1">Modo Teste Ativo</p>
                    <ul className="text-xs text-amber-400/80 space-y-1">
                      <li>• APIs NÃO são chamadas (dados simulados)</li>
                      <li>• Nenhum crédito será gasto</li>
                      <li>• Conteúdo marcado como "(SIMULADO)"</li>
                      <li>• Ideal para desenvolvimento e testes</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-status-success/10 border border-status-success/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-status-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-status-success mb-1">Produção Real Ativa</p>
                    <ul className="text-xs text-status-success/80 space-y-1">
                      <li>• APIs REAIS sendo chamadas</li>
                      <li>• Créditos serão consumidos</li>
                      <li>• Vídeos renderizados de verdade</li>
                      <li>• Uploads para YouTube serão reais</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* All Available APIs Reference */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 text-accent-purple" />
            <div>
              <CardTitle>APIs Disponíveis</CardTitle>
              <CardDescription>
                Lista completa de provedores de API e OAuth
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-text-primary mb-2">Chaves de API</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {ALL_API_PROVIDERS.map((provider) => (
                  <div
                    key={provider.key}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg text-xs"
                  >
                    <Key className="w-3 h-3 text-status-warning" />
                    <span className="text-text-secondary">{provider.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-text-primary mb-2">OAuth (Autenticação)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {OAUTH_PROVIDERS.map((provider) => {
                  const Icon = provider.icon
                  return (
                    <div
                      key={provider.key}
                      className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg text-xs"
                    >
                      <Icon className={`w-3 h-3 ${provider.color}`} />
                      <span className="text-text-secondary">{provider.label}</span>
                      <span className="ml-auto px-1.5 py-0.5 bg-accent-blue/20 text-accent-blue rounded text-[10px]">
                        OAuth
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Mode Modal */}
      <AnimatePresence>
        {showCustomModeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowCustomModeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-2xl my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Sliders className="w-6 h-6 text-accent-purple" />
                  <h2 className="text-lg font-bold text-text-primary">Criar Modo Personalizado</h2>
                </div>
                <button
                  onClick={() => setShowCustomModeModal(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-text-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Mode Name */}
                <Input
                  label="Nome do Modo"
                  value={customModeConfig.nome}
                  onChange={(e) => setCustomModeConfig({ ...customModeConfig, nome: e.target.value })}
                  placeholder="Ex: Meu Modo Econômico"
                />

                {/* Step 1: Roteiro */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <FileText className="w-4 h-4 text-accent-blue" />
                    Etapa Roteiro
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { value: 'gemini' as RoteiroOption, label: 'Gemini 2.5 Flash', cost: 'grátis', badge: 'Padrão' },
                      { value: 'claude' as RoteiroOption, label: 'Claude 3.5 Sonnet', cost: '~$0.015', badge: 'Premium' },
                      { value: 'gpt4' as RoteiroOption, label: 'GPT-4o', cost: '~$0.02', badge: '' },
                      { value: 'manual' as RoteiroOption, label: 'Escrever manualmente', cost: 'grátis', badge: '' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setCustomModeConfig({ ...customModeConfig, roteiro: option.value })}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          customModeConfig.roteiro === option.value
                            ? 'border-accent-blue bg-accent-blue/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-text-primary">{option.label}</p>
                          {option.badge && (
                            <span className={`px-1.5 py-0.5 text-[10px] rounded ${
                              option.badge === 'Premium' ? 'bg-accent-purple/20 text-accent-purple' : 'bg-status-success/20 text-status-success'
                            }`}>
                              {option.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary">{option.cost}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Títulos e SEO */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <FileText className="w-4 h-4 text-accent-purple" />
                    Etapa Títulos e SEO
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { value: 'gemini' as TituloSeoOption, label: 'Gemini', cost: 'grátis' },
                      { value: 'claude' as TituloSeoOption, label: 'Claude 3.5', cost: '~$0.008' },
                      { value: 'gpt4' as TituloSeoOption, label: 'GPT-4o', cost: '~$0.01' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setCustomModeConfig({ ...customModeConfig, tituloSeo: option.value })}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          customModeConfig.tituloSeo === option.value
                            ? 'border-accent-purple bg-accent-purple/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <p className="text-sm font-medium text-text-primary">{option.label}</p>
                        <p className="text-xs text-text-secondary">{option.cost}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 3: Thumbnails */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <Image className="w-4 h-4 text-status-warning" />
                    Etapa Thumbnails
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { value: 'dalle-standard' as ThumbnailOption, label: 'DALL-E 3 Standard', cost: '~$0.04' },
                      { value: 'dalle-hd' as ThumbnailOption, label: 'DALL-E 3 HD', cost: '~$0.08' },
                      { value: 'manual' as ThumbnailOption, label: 'Criar no Canva', cost: 'grátis' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setCustomModeConfig({ ...customModeConfig, thumbnail: option.value })}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          customModeConfig.thumbnail === option.value
                            ? 'border-status-warning bg-status-warning/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <p className="text-sm font-medium text-text-primary">{option.label}</p>
                        <p className="text-xs text-text-secondary">{option.cost}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 4: Narração */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <Mic className="w-4 h-4 text-status-success" />
                    Etapa Narração
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { value: 'elevenlabs-multilingual' as NarracaoOption, label: 'ElevenLabs Multilingual', cost: '~$0.05/min' },
                      { value: 'elevenlabs-turbo' as NarracaoOption, label: 'ElevenLabs Turbo', cost: '~$0.02/min' },
                      { value: 'manual' as NarracaoOption, label: 'Gravar minha voz', cost: 'grátis' },
                      { value: 'capcut-tts' as NarracaoOption, label: 'TTS do CapCut', cost: 'grátis' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setCustomModeConfig({ ...customModeConfig, narracao: option.value })}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          customModeConfig.narracao === option.value
                            ? 'border-status-success bg-status-success/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <p className="text-sm font-medium text-text-primary">{option.label}</p>
                        <p className="text-xs text-text-secondary">{option.cost}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 5: Vídeo */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <Video className="w-4 h-4 text-red-500" />
                    Etapa Vídeo
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { value: 'json2video' as VideoOption, label: 'JSON2Video automático', cost: '~$0.40/min' },
                      { value: 'capcut' as VideoOption, label: 'Montar no CapCut', cost: 'grátis' },
                      { value: 'remotion' as VideoOption, label: 'Remotion (devs)', cost: 'grátis' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setCustomModeConfig({ ...customModeConfig, video: option.value })}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          customModeConfig.video === option.value
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <p className="text-sm font-medium text-text-primary">{option.label}</p>
                        <p className="text-xs text-text-secondary">{option.cost}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 6: Upload */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <Upload className="w-4 h-4 text-accent-blue" />
                    Etapa Upload
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { value: 'youtube-api' as UploadOption, label: 'Publicar via API', cost: 'grátis' },
                      { value: 'manual' as UploadOption, label: 'Baixar e publicar', cost: 'grátis' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setCustomModeConfig({ ...customModeConfig, upload: option.value })}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          customModeConfig.upload === option.value
                            ? 'border-accent-blue bg-accent-blue/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <p className="text-sm font-medium text-text-primary">{option.label}</p>
                        <p className="text-xs text-text-secondary">{option.cost}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cost Summary */}
                <div className="p-4 bg-gradient-to-r from-accent-purple/10 to-accent-blue/10 border border-accent-purple/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-status-warning" />
                    <h3 className="font-semibold text-text-primary">Custo Estimado</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-text-secondary">Por vídeo</p>
                      <p className="text-2xl font-bold text-text-primary">${customCosts.perVideo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary">Mensal (20 vídeos)</p>
                      <p className="text-2xl font-bold text-text-primary">${customCosts.monthly}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-white/10">
                <Button variant="ghost" onClick={() => setShowCustomModeModal(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveCustomMode}
                  icon={<Save className="w-4 h-4" />}
                >
                  Salvar Modo Personalizado
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add API Key Modal */}
      <AnimatePresence>
        {showAddApiModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddApiModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text-primary">Adicionar API Key</h2>
                <button
                  onClick={() => setShowAddApiModal(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-text-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <Input
                  label="Nome do Provedor"
                  placeholder="Ex: DeepSeek, Cohere..."
                  value={newApiKey.nome || ''}
                  onChange={(e) => setNewApiKey({ ...newApiKey, nome: e.target.value })}
                />
                <div className="relative">
                  <Input
                    label="API Key"
                    type={showKeys['newApiKey'] ? 'text' : 'password'}
                    placeholder="sk-..."
                    value={newApiKey.key || ''}
                    onChange={(e) => setNewApiKey({ ...newApiKey, key: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('newApiKey')}
                    className="absolute right-3 top-9 text-text-secondary hover:text-text-primary"
                  >
                    {showKeys['newApiKey'] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div>
                  <p className="text-xs text-text-secondary mb-2">Ou selecione um provedor:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_API_PROVIDERS.filter(
                      (p) => !apiKeyFields.find((f) => f.key === p.key)
                    ).slice(0, 6).map((provider) => (
                      <button
                        key={provider.key}
                        type="button"
                        onClick={() => setNewApiKey({ ...newApiKey, nome: provider.label })}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-xs text-text-secondary hover:text-text-primary transition-colors"
                      >
                        {provider.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" onClick={() => setShowAddApiModal(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddCustomApiKey}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Adicionar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Test Mode Confirmation Modal */}
      <AnimatePresence>
        {showTestModeConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowTestModeConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-status-warning/20 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6 text-status-warning" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Atenção</h2>
                  <p className="text-sm text-text-secondary">Confirme a mudança de modo</p>
                </div>
              </div>

              <div className="p-4 bg-status-warning/10 border border-status-warning/20 rounded-xl mb-4">
                <p className="text-sm text-text-primary mb-3">
                  Ao desativar o Modo Teste, todas as operações serão <strong className="text-status-warning">REAIS</strong>:
                </p>
                <ul className="text-sm text-text-secondary space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
                    APIs serão chamadas (pode gerar custos)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
                    Vídeos serão renderizados de verdade
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
                    Uploads para o YouTube serão reais
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
                    Créditos das APIs serão consumidos
                  </li>
                </ul>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowTestModeConfirm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    setConfiguracoes({ appMode: 'production' })
                    setShowTestModeConfirm(false)
                    addToast({ type: 'success', message: 'Modo Produção ativado - APIs reais!' })
                  }}
                  className="bg-status-warning hover:bg-status-warning/90 text-black"
                >
                  Confirmar - Ir para Produção
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Health Check Modal */}
      <HealthCheckModal
        isOpen={showHealthCheckModal}
        onClose={() => setShowHealthCheckModal(false)}
        onSuccess={() => {
          setShowHealthCheckModal(false)
          setConfiguracoes({ appMode: 'production' })
          addToast({ type: 'success', message: 'Modo Produção ativado - APIs reais!' })
        }}
      />

      {/* Edit API Key Modal */}
      <AnimatePresence>
        {showEditApiModal && editingApiKey && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowEditApiModal(false)
              setEditingApiKey(null)
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text-primary">
                  Editar API Key - {editingApiKey.label}
                </h2>
                <button
                  onClick={() => {
                    setShowEditApiModal(false)
                    setEditingApiKey(null)
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-text-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    label="API Key"
                    type={showKeys['editApiKey'] ? 'text' : 'password'}
                    placeholder="Cole a nova API Key..."
                    value={editingApiKey.value}
                    onChange={(e) => setEditingApiKey({ ...editingApiKey, value: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('editApiKey')}
                    className="absolute right-3 top-9 text-text-secondary hover:text-text-primary"
                  >
                    {showKeys['editApiKey'] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="p-3 bg-status-warning/10 border border-status-warning/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-status-warning flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-status-warning">
                      Certifique-se de que a nova chave seja válida antes de salvar.
                      A chave anterior será substituída permanentemente.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowEditApiModal(false)
                    setEditingApiKey(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveEditedApiKey}
                  icon={<Save className="w-4 h-4" />}
                >
                  Salvar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Production Password Verification Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-status-warning/20 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-status-warning" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Verificação de Segurança</h2>
                  <p className="text-sm text-text-secondary">Digite sua senha para ativar o modo produção</p>
                </div>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!productionPassword) {
                    setPasswordError('Digite sua senha')
                    return
                  }

                  setVerifyingPassword(true)
                  setPasswordError('')

                  const result = await verifyProductionPassword(productionPassword)

                  if (result.success) {
                    setShowPasswordModal(false)
                    setProductionPassword('')
                    // After password verification, run health check
                    setShowHealthCheckModal(true)
                  } else {
                    setPasswordError(result.error || 'Senha incorreta')
                  }

                  setVerifyingPassword(false)
                }}
                className="space-y-4"
              >
                {/* Error Message */}
                {passwordError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-status-error/10 border border-status-error/30 rounded-xl flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-status-error flex-shrink-0" />
                    <p className="text-sm text-status-error">{passwordError}</p>
                  </motion.div>
                )}

                {/* Password Input */}
                <div className="relative">
                  <Input
                    type={showKeys['productionPassword'] ? 'text' : 'password'}
                    placeholder="Digite sua senha"
                    value={productionPassword}
                    onChange={(e) => setProductionPassword(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('productionPassword')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  >
                    {showKeys['productionPassword'] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Warning Info */}
                <div className="p-3 bg-status-warning/10 border border-status-warning/20 rounded-xl">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-status-warning flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-status-warning">
                      Ao ativar o modo produção, todas as operações usarão APIs reais e poderão gerar custos.
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowPasswordModal(false)
                      setProductionPassword('')
                      setPasswordError('')
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={verifyingPassword || !productionPassword}
                    className="bg-status-warning hover:bg-status-warning/90 text-black"
                  >
                    {verifyingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Verificando...
                      </>
                    ) : (
                      'Confirmar e Continuar'
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
