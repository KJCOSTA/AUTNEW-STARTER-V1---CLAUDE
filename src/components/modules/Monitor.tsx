import { useState } from 'react'
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
import type { APIStatus } from '../../types'

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

  const testConnection = async (apiName: string) => {
    setTesting(apiName)
    try {
      // Simulate API test
      await new Promise((r) => setTimeout(r, 1500))

      const endpoints: Record<string, string> = {
        Gemini: '/api/gemini',
        OpenAI: '/api/openai',
        ElevenLabs: '/api/elevenlabs',
        JSON2Video: '/api/json2video',
        YouTube: '/api/youtube/auth',
      }

      const response = await fetch(endpoints[apiName], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      })

      const newStatus = apiStatus.map((api) =>
        api.name === apiName
          ? {
              ...api,
              status: response.ok ? ('online' as APIStatus) : ('offline' as APIStatus),
              lastCheck: new Date().toISOString(),
              message: response.ok ? 'Conexão estabelecida' : 'Falha na conexão',
            }
          : api
      )

      setAPIStatus(newStatus)
      addToast({
        type: response.ok ? 'success' : 'error',
        message: `${apiName}: ${response.ok ? 'Conectado!' : 'Falha na conexão'}`,
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

  // Mock statistics
  const stats = {
    roteirosGerados: 12,
    thumbnailsGeradas: 8,
    tokensConsumidos: 45000,
    custoEstimado: 2.35,
  }

  // Mock credits for production mode
  const credits = {
    elevenlabs: { used: 25, total: 60, unit: 'minutos' },
    json2video: { used: 1200, total: 7200, unit: 'créditos' },
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Torre de Controle</h1>
            <p className="text-sm text-text-secondary">
              Status das APIs e recursos do sistema
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={testAllConnections}
          disabled={testing !== null}
          icon={<RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />}
        >
          Testar Todas
        </Button>
      </div>

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

      {/* Session Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas da Sessão</CardTitle>
          <CardDescription>Uso acumulado desde o início</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-background/50">
              <div className="flex items-center gap-2 text-text-secondary mb-2">
                <FileText className="w-4 h-4" />
                <span className="text-xs">Roteiros</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">
                {stats.roteirosGerados}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-background/50">
              <div className="flex items-center gap-2 text-text-secondary mb-2">
                <Image className="w-4 h-4" />
                <span className="text-xs">Thumbnails</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">
                {stats.thumbnailsGeradas}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-background/50">
              <div className="flex items-center gap-2 text-text-secondary mb-2">
                <Zap className="w-4 h-4" />
                <span className="text-xs">Tokens Gemini</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">
                {(stats.tokensConsumidos / 1000).toFixed(1)}K
              </p>
            </div>
            <div className="p-4 rounded-xl bg-background/50">
              <div className="flex items-center gap-2 text-text-secondary mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs">Custo Estimado</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">
                ${stats.custoEstimado.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Production Credits */}
      {configuracoes.modo === 'producao' && (
        <Card>
          <CardHeader>
            <CardTitle>Créditos (Modo Produção)</CardTitle>
            <CardDescription>Recursos disponíveis para uso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ElevenLabs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-accent-purple" />
                  <span className="text-sm text-text-primary">ElevenLabs</span>
                </div>
                <span className="text-sm text-text-secondary">
                  {credits.elevenlabs.used}/{credits.elevenlabs.total}{' '}
                  {credits.elevenlabs.unit}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(credits.elevenlabs.used / credits.elevenlabs.total) * 100}%`,
                  }}
                  className="h-full bg-gradient-accent"
                />
              </div>
              {credits.elevenlabs.used / credits.elevenlabs.total > 0.8 && (
                <p className="text-xs text-status-warning mt-1">
                  Créditos baixos! Considere renovar.
                </p>
              )}
            </div>

            {/* JSON2Video */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-accent-blue" />
                  <span className="text-sm text-text-primary">JSON2Video</span>
                </div>
                <span className="text-sm text-text-secondary">
                  {credits.json2video.used}/{credits.json2video.total}{' '}
                  {credits.json2video.unit}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(credits.json2video.used / credits.json2video.total) * 100}%`,
                  }}
                  className="h-full bg-gradient-accent"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
