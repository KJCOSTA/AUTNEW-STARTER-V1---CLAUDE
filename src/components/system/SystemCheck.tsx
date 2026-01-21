import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Database,
  Server,
  Key,
  Wifi,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  Loader2,
  Settings,
  Shield,
} from 'lucide-react'

interface CheckResult {
  name: string
  status: 'pending' | 'checking' | 'success' | 'warning' | 'error'
  message: string
  details?: string
  duration?: number
}

interface SystemCheckProps {
  onComplete: () => void
  onSkip?: () => void
}

export function SystemCheck({ onComplete, onSkip }: SystemCheckProps) {
  const [checks, setChecks] = useState<CheckResult[]>([
    { name: 'Servidor', status: 'pending', message: 'Aguardando...' },
    { name: 'Banco de Dados', status: 'pending', message: 'Aguardando...' },
    { name: 'Variáveis de Ambiente', status: 'pending', message: 'Aguardando...' },
    { name: 'APIs Configuradas', status: 'pending', message: 'Aguardando...' },
    { name: 'Conexão Real APIs', status: 'pending', message: 'Aguardando...' },
  ])
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [showLog, setShowLog] = useState(false)
  const [logContent, setLogContent] = useState('')
  const [copied, setCopied] = useState(false)
  const [hasErrors, setHasErrors] = useState(false)

  const updateCheck = (index: number, update: Partial<CheckResult>) => {
    setChecks(prev => {
      const newChecks = [...prev]
      newChecks[index] = { ...newChecks[index], ...update }
      return newChecks
    })
  }

  const generateLog = useCallback((checksData: CheckResult[], start: Date) => {
    const end = new Date()
    const duration = end.getTime() - start.getTime()

    const lines = [
      '═══════════════════════════════════════════════════════════════',
      '                    AUTNEW - System Check Log                   ',
      '═══════════════════════════════════════════════════════════════',
      '',
      `Data/Hora: ${start.toLocaleString('pt-BR')}`,
      `Duração Total: ${duration}ms`,
      `Ambiente: ${window.location.hostname}`,
      `User Agent: ${navigator.userAgent}`,
      '',
      '───────────────────────────────────────────────────────────────',
      '                         RESULTADOS                             ',
      '───────────────────────────────────────────────────────────────',
      '',
    ]

    checksData.forEach((check, i) => {
      const statusIcon = check.status === 'success' ? '✓' : check.status === 'warning' ? '⚠' : '✗'
      const statusText = check.status === 'success' ? 'OK' : check.status === 'warning' ? 'AVISO' : 'ERRO'

      lines.push(`${i + 1}. ${check.name}`)
      lines.push(`   Status: [${statusIcon}] ${statusText}`)
      lines.push(`   Mensagem: ${check.message}`)
      if (check.duration) {
        lines.push(`   Tempo: ${check.duration}ms`)
      }
      if (check.details) {
        lines.push(`   Detalhes: ${check.details}`)
      }
      lines.push('')
    })

    const successCount = checksData.filter(c => c.status === 'success').length
    const warningCount = checksData.filter(c => c.status === 'warning').length
    const errorCount = checksData.filter(c => c.status === 'error').length

    lines.push('───────────────────────────────────────────────────────────────')
    lines.push('                          RESUMO                               ')
    lines.push('───────────────────────────────────────────────────────────────')
    lines.push('')
    lines.push(`Total de Verificações: ${checksData.length}`)
    lines.push(`✓ Sucesso: ${successCount}`)
    lines.push(`⚠ Avisos: ${warningCount}`)
    lines.push(`✗ Erros: ${errorCount}`)
    lines.push('')

    if (errorCount === 0) {
      lines.push('STATUS FINAL: ✓ Sistema pronto para uso')
    } else {
      lines.push('STATUS FINAL: ✗ Existem problemas que precisam ser resolvidos')
    }

    lines.push('')
    lines.push('═══════════════════════════════════════════════════════════════')
    lines.push('        Copie este log e envie para suporte se necessário       ')
    lines.push('═══════════════════════════════════════════════════════════════')

    return lines.join('\n')
  }, [])

  const runChecks = async () => {
    setIsRunning(true)
    setIsComplete(false)
    setHasErrors(false)
    const start = new Date()

    // Reset all checks
    setChecks([
      { name: 'Servidor', status: 'pending', message: 'Aguardando...' },
      { name: 'Banco de Dados', status: 'pending', message: 'Aguardando...' },
      { name: 'Variáveis de Ambiente', status: 'pending', message: 'Aguardando...' },
      { name: 'APIs Configuradas', status: 'pending', message: 'Aguardando...' },
      { name: 'Conexão Real APIs', status: 'pending', message: 'Aguardando...' },
    ])

    const results: CheckResult[] = []

    // Check 1: Server connectivity
    updateCheck(0, { status: 'checking', message: 'Verificando conexão com servidor...' })
    const serverStart = Date.now()
    try {
      const response = await fetch('/api/system-check?check=server', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      const serverDuration = Date.now() - serverStart

      if (response.ok) {
        results[0] = {
          name: 'Servidor',
          status: 'success',
          message: 'Servidor online e respondendo',
          duration: serverDuration
        }
      } else {
        results[0] = {
          name: 'Servidor',
          status: 'error',
          message: `Servidor retornou erro ${response.status}`,
          duration: serverDuration
        }
      }
    } catch (error: any) {
      results[0] = {
        name: 'Servidor',
        status: 'error',
        message: 'Não foi possível conectar ao servidor',
        details: error.message,
        duration: Date.now() - serverStart
      }
    }
    updateCheck(0, results[0])

    // Check 2: Database
    updateCheck(1, { status: 'checking', message: 'Verificando banco de dados...' })
    const dbStart = Date.now()
    try {
      const response = await fetch('/api/system-check?check=database')
      const dbDuration = Date.now() - dbStart
      const data = await response.json()

      if (data.status === 'healthy' || data.database?.connected) {
        const tables = data.database?.tables || []
        results[1] = {
          name: 'Banco de Dados',
          status: 'success',
          message: 'Conectado e funcionando',
          details: `Tabelas: ${tables.join(', ') || 'verificadas'}`,
          duration: dbDuration
        }
      } else if (data.database?.configured === false) {
        results[1] = {
          name: 'Banco de Dados',
          status: 'warning',
          message: 'Não configurado (modo desenvolvimento)',
          details: 'POSTGRES_URL não definida',
          duration: dbDuration
        }
      } else {
        results[1] = {
          name: 'Banco de Dados',
          status: 'error',
          message: data.database?.error || 'Erro na conexão',
          details: data.database?.details,
          duration: dbDuration
        }
      }
    } catch (error: any) {
      results[1] = {
        name: 'Banco de Dados',
        status: 'error',
        message: 'Erro ao verificar banco de dados',
        details: error.message,
        duration: Date.now() - dbStart
      }
    }
    updateCheck(1, results[1])

    // Check 3: Environment Variables
    updateCheck(2, { status: 'checking', message: 'Verificando variáveis de ambiente...' })
    const envStart = Date.now()
    try {
      const response = await fetch('/api/system-check?check=env')
      const envDuration = Date.now() - envStart
      const data = await response.json()

      const missing = data.env?.missing || []
      const configured = data.env?.configured || []

      if (missing.length === 0) {
        results[2] = {
          name: 'Variáveis de Ambiente',
          status: 'success',
          message: 'Todas as variáveis críticas configuradas',
          details: `Configuradas: ${configured.length}`,
          duration: envDuration
        }
      } else if (data.env?.criticalMissing?.length > 0) {
        results[2] = {
          name: 'Variáveis de Ambiente',
          status: 'error',
          message: `Variáveis críticas faltando: ${data.env.criticalMissing.join(', ')}`,
          details: `Total faltando: ${missing.length}`,
          duration: envDuration
        }
      } else {
        results[2] = {
          name: 'Variáveis de Ambiente',
          status: 'warning',
          message: `Algumas variáveis opcionais não configuradas`,
          details: `Faltando: ${missing.join(', ')}`,
          duration: envDuration
        }
      }
    } catch (error: any) {
      results[2] = {
        name: 'Variáveis de Ambiente',
        status: 'warning',
        message: 'Não foi possível verificar variáveis',
        details: error.message,
        duration: Date.now() - envStart
      }
    }
    updateCheck(2, results[2])

    // Check 4: APIs
    updateCheck(3, { status: 'checking', message: 'Verificando APIs configuradas...' })
    const apiStart = Date.now()
    try {
      const response = await fetch('/api/system-check?check=apis')
      const apiDuration = Date.now() - apiStart
      const data = await response.json()

      const apis = data.apis || {}
      const configuredApis = Object.entries(apis).filter(([, v]: [string, any]) => v.configured).map(([k]) => k)
      const criticalApis = ['gemini']
      const criticalConfigured = criticalApis.filter(api => configuredApis.includes(api))

      if (criticalConfigured.length === criticalApis.length) {
        results[3] = {
          name: 'APIs Configuradas',
          status: 'success',
          message: `${configuredApis.length} API(s) configurada(s)`,
          details: `Configuradas: ${configuredApis.join(', ') || 'nenhuma'}`,
          duration: apiDuration
        }
      } else {
        const missingCritical = criticalApis.filter(api => !configuredApis.includes(api))
        results[3] = {
          name: 'APIs Configuradas',
          status: 'warning',
          message: `APIs críticas não configuradas: ${missingCritical.join(', ')}`,
          details: `Configuradas: ${configuredApis.join(', ') || 'nenhuma'}`,
          duration: apiDuration
        }
      }
    } catch (error: any) {
      results[3] = {
        name: 'APIs Configuradas',
        status: 'warning',
        message: 'Não foi possível verificar APIs',
        details: error.message,
        duration: Date.now() - apiStart
      }
    }
    updateCheck(3, results[3])

    // Check 5: Real API Connection Tests (deep=true)
    updateCheck(4, { status: 'checking', message: 'Testando conexão real com APIs...' })
    const deepApiStart = Date.now()
    try {
      const response = await fetch('/api/system-check?check=apis&deep=true')
      const deepApiDuration = Date.now() - deepApiStart
      const data = await response.json()

      const apis = data.apis || {}
      const testedApis = Object.entries(apis).filter(([, v]: [string, any]) => v.configured && v.connected !== undefined)
      const connectedApis = testedApis.filter(([, v]: [string, any]) => v.connected)
      const failedApis = testedApis.filter(([, v]: [string, any]) => !v.connected)

      if (testedApis.length === 0) {
        results[4] = {
          name: 'Conexão Real APIs',
          status: 'warning',
          message: 'Nenhuma API configurada para testar',
          duration: deepApiDuration
        }
      } else if (failedApis.length === 0) {
        const apiNames = connectedApis.map(([k]) => k).join(', ')
        results[4] = {
          name: 'Conexão Real APIs',
          status: 'success',
          message: `${connectedApis.length}/${testedApis.length} APIs conectadas`,
          details: `OK: ${apiNames}`,
          duration: deepApiDuration
        }
      } else {
        const failedNames = failedApis.map(([k, v]: [string, any]) => `${k}(${v.error || 'erro'})`).join(', ')
        const okNames = connectedApis.map(([k]) => k).join(', ')
        results[4] = {
          name: 'Conexão Real APIs',
          status: failedApis.length === testedApis.length ? 'error' : 'warning',
          message: `${connectedApis.length}/${testedApis.length} APIs conectadas`,
          details: `OK: ${okNames || 'nenhuma'} | Falha: ${failedNames}`,
          duration: deepApiDuration
        }
      }
    } catch (error: any) {
      results[4] = {
        name: 'Conexão Real APIs',
        status: 'warning',
        message: 'Não foi possível testar conexões reais',
        details: error.message,
        duration: Date.now() - deepApiStart
      }
    }
    updateCheck(4, results[4])

    // Generate log
    const log = generateLog(results, start)
    setLogContent(log)

    // Check for errors
    const hasErr = results.some(r => r.status === 'error')
    setHasErrors(hasErr)
    setIsComplete(true)
    setIsRunning(false)
  }

  const handleCopyLog = async () => {
    try {
      await navigator.clipboard.writeText(logContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Erro ao copiar:', error)
    }
  }

  useEffect(() => {
    runChecks()
  }, [])

  const getStatusIcon = (status: CheckResult['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-5 h-5 rounded-full bg-white/10" />
      case 'checking':
        return <Loader2 className="w-5 h-5 text-accent-purple animate-spin" />
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-status-success" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-status-warning" />
      case 'error':
        return <XCircle className="w-5 h-5 text-status-error" />
    }
  }

  const getCheckIcon = (name: string) => {
    switch (name) {
      case 'Servidor':
        return <Server className="w-5 h-5" />
      case 'Banco de Dados':
        return <Database className="w-5 h-5" />
      case 'Variáveis de Ambiente':
        return <Settings className="w-5 h-5" />
      case 'APIs Configuradas':
        return <Key className="w-5 h-5" />
      case 'Conexão Real APIs':
        return <Wifi className="w-5 h-5" />
      default:
        return <Wifi className="w-5 h-5" />
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center"
          >
            <Shield className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Verificação do Sistema
          </h1>
          <p className="text-text-secondary">
            Checando conexões e configurações...
          </p>
        </div>

        {/* Check List */}
        <div className="bg-card-bg rounded-xl border border-white/10 overflow-hidden mb-4">
          {checks.map((check, index) => (
            <motion.div
              key={check.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-4 p-4 ${
                index !== checks.length - 1 ? 'border-b border-white/5' : ''
              }`}
            >
              <div className="text-text-secondary">
                {getCheckIcon(check.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-text-primary">{check.name}</div>
                <div className="text-sm text-text-secondary truncate">
                  {check.message}
                </div>
              </div>
              <div className="flex-shrink-0">
                {getStatusIcon(check.status)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <AnimatePresence mode="wait">
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {/* Show Log Button */}
              <button
                onClick={() => setShowLog(!showLog)}
                className="w-full flex items-center justify-between p-4 bg-card-bg rounded-xl border border-white/10 hover:border-white/20 transition-colors"
              >
                <span className="text-text-secondary">Ver log completo</span>
                <ChevronRight
                  className={`w-5 h-5 text-text-secondary transition-transform ${
                    showLog ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {/* Log Content */}
              <AnimatePresence>
                {showLog && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="relative">
                      <pre className="bg-black/50 rounded-xl p-4 text-xs text-text-secondary overflow-x-auto max-h-64 overflow-y-auto font-mono">
                        {logContent}
                      </pre>
                      <button
                        onClick={handleCopyLog}
                        className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        title="Copiar log"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-status-success" />
                        ) : (
                          <Copy className="w-4 h-4 text-text-secondary" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={runChecks}
                  disabled={isRunning}
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-text-secondary transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
                  Verificar Novamente
                </button>

                {!hasErrors ? (
                  <button
                    onClick={onComplete}
                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-accent-purple to-accent-pink rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    Continuar
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={onSkip || onComplete}
                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-status-warning/20 hover:bg-status-warning/30 rounded-xl text-status-warning font-medium transition-colors"
                  >
                    Continuar Mesmo Assim
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Summary */}
              {hasErrors && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 bg-status-error/10 border border-status-error/20 rounded-xl"
                >
                  <p className="text-sm text-status-error text-center">
                    Alguns problemas foram detectados. Copie o log acima e envie para suporte.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
