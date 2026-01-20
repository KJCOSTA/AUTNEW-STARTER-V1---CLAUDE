import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
  RefreshCw,
  X,
} from 'lucide-react'
import { Button } from './Button'

interface APIHealthResult {
  name: string
  envVar: string
  configured: boolean
  connected: boolean
  error?: string
  errorType?: 'missing_key' | 'invalid_key' | 'network_error' | 'quota_exceeded' | 'unknown'
  documentation?: string
  fixSteps?: string[]
}

interface HealthCheckResponse {
  success: boolean
  results: APIHealthResult[]
  criticalFailures: string[]
  summary: {
    total: number
    configured: number
    connected: number
    failed: number
  }
}

interface HealthCheckModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type CheckStatus = 'idle' | 'running' | 'completed' | 'failed'

export function HealthCheckModal({ isOpen, onClose, onSuccess }: HealthCheckModalProps) {
  const [status, setStatus] = useState<CheckStatus>('idle')
  const [results, setResults] = useState<APIHealthResult[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [summary, setSummary] = useState<HealthCheckResponse['summary'] | null>(null)
  const [criticalFailures, setCriticalFailures] = useState<string[]>([])
  const [expandedErrors, setExpandedErrors] = useState<Record<string, boolean>>({})
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const runHealthCheck = useCallback(async () => {
    setStatus('running')
    setResults([])
    setCurrentIndex(0)
    setSummary(null)
    setCriticalFailures([])

    try {
      const response = await fetch('/api/health-check')
      const data: HealthCheckResponse = await response.json()

      // Simulate progressive loading for better UX
      for (let i = 0; i < data.results.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 300))
        setCurrentIndex(i + 1)
        setResults((prev) => [...prev, data.results[i]])
      }

      await new Promise((resolve) => setTimeout(resolve, 500))

      setSummary(data.summary)
      setCriticalFailures(data.criticalFailures)
      setStatus(data.success ? 'completed' : 'failed')
    } catch (error) {
      setStatus('failed')
      setCriticalFailures(['Erro ao conectar com o servidor'])
    }
  }, [])

  // Auto-run when modal opens
  useEffect(() => {
    if (isOpen && status === 'idle') {
      runHealthCheck()
    }
  }, [isOpen, status, runHealthCheck])

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setStatus('idle')
      setResults([])
      setCurrentIndex(0)
      setSummary(null)
      setCriticalFailures([])
      setExpandedErrors({})
    }
  }, [isOpen])

  const toggleError = (envVar: string) => {
    setExpandedErrors((prev) => ({ ...prev, [envVar]: !prev[envVar] }))
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const getStatusIcon = (result: APIHealthResult) => {
    if (result.connected) {
      return <CheckCircle className="w-5 h-5 text-status-success" />
    }
    if (result.configured && !result.connected) {
      return <XCircle className="w-5 h-5 text-status-error" />
    }
    return <AlertTriangle className="w-5 h-5 text-status-warning" />
  }

  const getStatusColor = (result: APIHealthResult) => {
    if (result.connected) return 'border-status-success/30 bg-status-success/5'
    if (result.configured && !result.connected) return 'border-status-error/30 bg-status-error/5'
    return 'border-status-warning/30 bg-status-warning/5'
  }

  const handleProceed = () => {
    if (status === 'completed' && criticalFailures.length === 0) {
      onSuccess()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-card border border-white/10 rounded-2xl w-full max-w-2xl my-8 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-accent-purple/10 to-accent-blue/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary">
                    Health Check de APIs
                  </h2>
                  <p className="text-sm text-text-secondary">
                    Verificando conexões antes de ativar produção
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg text-text-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress */}
          {status === 'running' && (
            <div className="px-6 py-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">
                  Verificando APIs...
                </span>
                <span className="text-sm font-medium text-text-primary">
                  {currentIndex} / {results.length > 0 ? Math.max(currentIndex, 9) : 9}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent-purple to-accent-blue"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentIndex / 9) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* Results List */}
          <div className="p-6 max-h-[400px] overflow-y-auto">
            <div className="space-y-3">
              {results.map((result, index) => (
                <motion.div
                  key={result.envVar}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-xl border transition-all ${getStatusColor(result)}`}
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => !result.connected && toggleError(result.envVar)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result)}
                        <div>
                          <p className="font-medium text-text-primary">{result.name}</p>
                          <p className="text-xs text-text-secondary font-mono">
                            {result.envVar}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.connected ? (
                          <span className="px-2 py-1 bg-status-success/20 text-status-success text-xs font-medium rounded-lg">
                            Conectado
                          </span>
                        ) : result.configured ? (
                          <span className="px-2 py-1 bg-status-error/20 text-status-error text-xs font-medium rounded-lg">
                            Falha
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-status-warning/20 text-status-warning text-xs font-medium rounded-lg">
                            Não configurado
                          </span>
                        )}
                        {!result.connected && (
                          expandedErrors[result.envVar] ? (
                            <ChevronUp className="w-4 h-4 text-text-secondary" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-text-secondary" />
                          )
                        )}
                      </div>
                    </div>

                    {/* Error Details */}
                    <AnimatePresence>
                      {expandedErrors[result.envVar] && !result.connected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                            {/* Error Message */}
                            {result.error && (
                              <div className="p-3 bg-status-error/10 border border-status-error/20 rounded-lg">
                                <p className="text-sm text-status-error font-mono">
                                  {result.error}
                                </p>
                              </div>
                            )}

                            {/* Fix Steps */}
                            {result.fixSteps && result.fixSteps.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-text-primary">
                                  Como corrigir:
                                </p>
                                <ol className="space-y-1.5">
                                  {result.fixSteps.map((step, i) => (
                                    <li
                                      key={i}
                                      className="text-xs text-text-secondary flex items-start gap-2"
                                    >
                                      <span className="text-accent-blue">{i + 1}.</span>
                                      <span>{step.replace(/^\d+\.\s*/, '')}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2">
                              {result.documentation && (
                                <a
                                  href={result.documentation}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-blue/10 text-accent-blue text-xs font-medium rounded-lg hover:bg-accent-blue/20 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Documentação
                                </a>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyToClipboard(result.envVar, result.envVar)
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-text-secondary text-xs font-medium rounded-lg hover:bg-white/10 transition-colors"
                              >
                                <Copy className="w-3 h-3" />
                                {copiedText === result.envVar ? 'Copiado!' : 'Copiar variável'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}

              {/* Loading Placeholders */}
              {status === 'running' && results.length < 9 && (
                <>
                  {Array.from({ length: 9 - results.length }).map((_, i) => (
                    <div
                      key={`placeholder-${i}`}
                      className="p-4 rounded-xl border border-white/10 bg-white/5 animate-pulse"
                    >
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-text-secondary animate-spin" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-white/10 rounded" />
                          <div className="h-3 w-24 bg-white/10 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <div className="px-6 py-4 border-t border-white/10 bg-background/50">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-text-primary">{summary.total}</p>
                  <p className="text-xs text-text-secondary">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-status-success">{summary.connected}</p>
                  <p className="text-xs text-text-secondary">Conectados</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-status-warning">{summary.configured - summary.connected}</p>
                  <p className="text-xs text-text-secondary">Com Falha</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-text-secondary">{summary.total - summary.configured}</p>
                  <p className="text-xs text-text-secondary">Não Config.</p>
                </div>
              </div>
            </div>
          )}

          {/* Final Status */}
          {(status === 'completed' || status === 'failed') && (
            <div className="px-6 py-4 border-t border-white/10">
              {criticalFailures.length > 0 ? (
                <div className="p-4 bg-status-error/10 border border-status-error/30 rounded-xl mb-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-status-error flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-status-error mb-1">
                        APIs Críticas com Falha
                      </p>
                      <p className="text-sm text-text-secondary mb-2">
                        As seguintes APIs são obrigatórias para o modo produção:
                      </p>
                      <ul className="list-disc list-inside text-sm text-status-error">
                        {criticalFailures.map((name) => (
                          <li key={name}>{name}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-status-success/10 border border-status-success/30 rounded-xl mb-4">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-status-success flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-status-success mb-1">
                        Pronto para Produção!
                      </p>
                      <p className="text-sm text-text-secondary">
                        Todas as APIs críticas estão funcionando. Você pode ativar o modo produção com segurança.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStatus('idle')
                    runHealthCheck()
                  }}
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Testar Novamente
                </Button>
                {criticalFailures.length > 0 ? (
                  <Button variant="secondary" onClick={onClose}>
                    Voltar e Configurar
                  </Button>
                ) : (
                  <Button
                    onClick={handleProceed}
                    className="bg-status-success hover:bg-status-success/90"
                    icon={<CheckCircle className="w-4 h-4" />}
                  >
                    Ativar Modo Produção
                  </Button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
