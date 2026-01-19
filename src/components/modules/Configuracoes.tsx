import { useState, useRef } from 'react'
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
  Upload,
  HardDrive,
  FileSpreadsheet,
  Trash2,
  Film,
  Sparkles,
  Bot,
  Edit3,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import {
  Button,
  Input,
  Toggle,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../ui'
import type { OperationMode, APIKeyConfig } from '../../types'

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

export function Configuracoes() {
  const { configuracoes, setConfiguracoes, addToast } = useStore()
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [testing, setTesting] = useState<string | null>(null)
  const [showAddApiModal, setShowAddApiModal] = useState(false)
  const [showEditApiModal, setShowEditApiModal] = useState(false)
  const [editingApiKey, setEditingApiKey] = useState<{ key: string; label: string; value: string } | null>(null)
  const [newApiKey, setNewApiKey] = useState<Partial<APIKeyConfig>>({ nome: '', key: '', tipo: 'api-key' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleShowKey = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Handle CSV/XLS file upload for channel data
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validTypes = ['.csv', '.xls', '.xlsx']
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    if (!validTypes.includes(fileExt)) {
      addToast({ type: 'error', message: 'Formato inválido. Use CSV ou XLS/XLSX.' })
      return
    }

    // Simulate file processing
    addToast({ type: 'info', message: `Processando ${file.name}...` })

    // In real implementation, parse the file
    setTimeout(() => {
      addToast({ type: 'success', message: 'Dados do canal importados!' })
    }, 1500)
  }

  // Handle Google Drive connection
  const handleGoogleDriveConnect = () => {
    addToast({ type: 'info', message: 'Conectando ao Google Drive...' })
    // In real implementation, initiate OAuth
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
      'mvp': 'MVP',
      'producao': 'Produção',
      'full-ai': 'Full AI'
    }
    addToast({
      type: 'info',
      message: `Modo alterado para ${modeLabels[mode]}`,
    })
  }

  const handleYouTubeConnect = () => {
    // In a real implementation, this would initiate OAuth flow
    addToast({
      type: 'info',
      message: 'Redirecionando para autenticação do YouTube...',
    })
    // window.location.href = '/api/youtube/auth'
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

      {/* Operation Mode */}
      <Card variant="gradient">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-accent-blue" />
            <div>
              <CardTitle>Modo de Operação</CardTitle>
              <CardDescription>
                Escolha entre MVP, Produção ou Full AI
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* MVP Mode */}
            <button
              onClick={() => handleModeChange('mvp')}
              className={`p-4 rounded-xl border text-left transition-all ${
                configuracoes.modo === 'mvp'
                  ? 'border-accent-blue bg-accent-blue/10 ring-2 ring-accent-blue/50'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className={`w-5 h-5 ${configuracoes.modo === 'mvp' ? 'text-accent-blue' : 'text-text-secondary'}`} />
                <h4 className="font-medium text-text-primary">MVP</h4>
                {configuracoes.modo === 'mvp' && (
                  <CheckCircle className="w-4 h-4 text-accent-blue ml-auto" />
                )}
              </div>
              <p className="text-xs text-text-secondary mb-2">Gratuito - $0/mês</p>
              <ul className="space-y-1 text-xs text-text-secondary">
                <li>• Gemini para roteiros</li>
                <li>• DALL-E para thumbnails</li>
                <li>• Montagem manual (CapCut)</li>
              </ul>
            </button>

            {/* Production Mode */}
            <button
              onClick={() => handleModeChange('producao')}
              className={`p-4 rounded-xl border text-left transition-all ${
                configuracoes.modo === 'producao'
                  ? 'border-accent-purple bg-accent-purple/10 ring-2 ring-accent-purple/50'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Film className={`w-5 h-5 ${configuracoes.modo === 'producao' ? 'text-accent-purple' : 'text-text-secondary'}`} />
                <h4 className="font-medium text-text-primary">Produção</h4>
                {configuracoes.modo === 'producao' && (
                  <CheckCircle className="w-4 h-4 text-accent-purple ml-auto" />
                )}
              </div>
              <p className="text-xs text-text-secondary mb-2">~$10-15/mês</p>
              <ul className="space-y-1 text-xs text-text-secondary">
                <li>• Tudo do MVP +</li>
                <li>• ElevenLabs (narração)</li>
                <li>• JSON2Video (render)</li>
              </ul>
            </button>

            {/* Full AI Mode */}
            <button
              onClick={() => handleModeChange('full-ai')}
              className={`p-4 rounded-xl border text-left transition-all ${
                configuracoes.modo === 'full-ai'
                  ? 'border-status-success bg-status-success/10 ring-2 ring-status-success/50'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className={`w-5 h-5 ${configuracoes.modo === 'full-ai' ? 'text-status-success' : 'text-text-secondary'}`} />
                <h4 className="font-medium text-text-primary">Full AI</h4>
                {configuracoes.modo === 'full-ai' && (
                  <CheckCircle className="w-4 h-4 text-status-success ml-auto" />
                )}
              </div>
              <p className="text-xs text-text-secondary mb-2">~$25-40/mês</p>
              <ul className="space-y-1 text-xs text-text-secondary">
                <li>• Tudo do Produção +</li>
                <li>• Geração de vídeo IA</li>
                <li>• Visuais 100% gerados</li>
              </ul>
            </button>
          </div>

          {/* JSON2Video Watermark Option */}
          {(configuracoes.modo === 'producao' || configuracoes.modo === 'full-ai') && (
            <div className="mt-4 p-4 bg-background/50 rounded-xl">
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
                        {/* Edit Button */}
                        <button
                          onClick={() => handleEditApiKey(field.key, field.label)}
                          className="p-1.5 hover:bg-white/10 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {/* Remove Button */}
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
                        {/* Toggle Switch */}
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
              {/* OAuth Connection */}
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

              {/* Alternative: Import Data */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-text-primary">
                  Ou importe dados do seu canal:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* CSV/XLS Upload */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 p-4 border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-status-success/10 flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5 text-status-success" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary text-sm">Upload CSV/XLS</p>
                      <p className="text-xs text-text-secondary">
                        Importe planilha com dados do canal
                      </p>
                    </div>
                    <Upload className="w-4 h-4 text-text-secondary ml-auto" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Google Drive */}
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
            {/* API Keys */}
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

            {/* OAuth Providers */}
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

                {/* Quick Add from List */}
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
    </div>
  )
}
