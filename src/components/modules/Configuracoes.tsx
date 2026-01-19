import { useState } from 'react'
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
import type { OperationMode } from '../../types'

export function Configuracoes() {
  const { configuracoes, setConfiguracoes, addToast } = useStore()
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [testing, setTesting] = useState<string | null>(null)

  const toggleShowKey = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }))
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

  const handleModeChange = (isProdution: boolean) => {
    const newMode: OperationMode = isProdution ? 'producao' : 'mvp'

    // Check if production APIs are configured
    if (isProdution) {
      if (!configuracoes.apiKeys.elevenlabs || !configuracoes.apiKeys.json2video) {
        addToast({
          type: 'warning',
          message: 'Configure as API keys de ElevenLabs e JSON2Video para usar o modo Produção',
        })
      }
    }

    setConfiguracoes({ modo: newMode })
    addToast({
      type: 'info',
      message: `Modo alterado para ${isProdution ? 'Produção' : 'MVP'}`,
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
                Alterne entre MVP (gratuito) e Produção (com APIs pagas)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl">
            <div>
              <p className="font-medium text-text-primary">
                {configuracoes.modo === 'mvp' ? 'Modo MVP' : 'Modo Produção'}
              </p>
              <p className="text-sm text-text-secondary mt-1">
                {configuracoes.modo === 'mvp'
                  ? 'Usa apenas APIs gratuitas. Montagem manual no CapCut.'
                  : 'Narração e renderização automáticas. Requer créditos.'}
              </p>
            </div>
            <Toggle
              checked={configuracoes.modo === 'producao'}
              onChange={(checked) => handleModeChange(checked)}
              label={configuracoes.modo === 'producao' ? 'Produção' : 'MVP'}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-xl border ${
                configuracoes.modo === 'mvp'
                  ? 'border-accent-blue bg-accent-blue/5'
                  : 'border-white/10'
              }`}
            >
              <h4 className="font-medium text-text-primary">MVP (Gratuito)</h4>
              <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                <li>• Gemini para roteiros e análise</li>
                <li>• DALL-E para thumbnails (opcional)</li>
                <li>• Checklist para montagem manual</li>
                <li>• Custo: $0/mês</li>
              </ul>
            </div>
            <div
              className={`p-4 rounded-xl border ${
                configuracoes.modo === 'producao'
                  ? 'border-accent-purple bg-accent-purple/5'
                  : 'border-white/10'
              }`}
            >
              <h4 className="font-medium text-text-primary">Produção</h4>
              <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                <li>• Tudo do MVP +</li>
                <li>• ElevenLabs para narração</li>
                <li>• JSON2Video para renderização</li>
                <li>• Custo: ~$10-15/mês</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-status-warning" />
            <div>
              <CardTitle>Chaves de API</CardTitle>
              <CardDescription>
                Configure suas credenciais de acesso
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiKeyFields.map((field) => (
            <div
              key={field.key}
              className={`p-4 rounded-xl border ${
                field.production && configuracoes.modo === 'mvp'
                  ? 'border-white/5 opacity-50'
                  : 'border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="text-sm font-medium text-text-primary">
                    {field.label}
                    {field.required && (
                      <span className="text-status-error ml-1">*</span>
                    )}
                    {field.production && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-accent-purple/20 text-accent-purple rounded">
                        Produção
                      </span>
                    )}
                  </label>
                  <p className="text-xs text-text-secondary">{field.description}</p>
                </div>
                {configuracoes.apiKeys[field.key as keyof typeof configuracoes.apiKeys] && (
                  <CheckCircle className="w-4 h-4 text-status-success" />
                )}
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
                    disabled={field.production && configuracoes.modo === 'mvp'}
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
                  disabled={
                    !configuracoes.apiKeys[
                      field.key as keyof typeof configuracoes.apiKeys
                    ] ||
                    (field.production && configuracoes.modo === 'mvp')
                  }
                >
                  Testar
                </Button>
              </div>
            </div>
          ))}
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
            <div className="text-center py-6">
              <Youtube className="w-12 h-12 mx-auto mb-4 text-text-secondary" />
              <p className="text-text-secondary mb-4">
                Conecte seu canal para publicar vídeos diretamente
              </p>
              <Button
                onClick={handleYouTubeConnect}
                icon={<ExternalLink className="w-4 h-4" />}
              >
                Conectar com YouTube
              </Button>
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
    </div>
  )
}
