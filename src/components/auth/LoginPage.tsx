import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Zap,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button, Input } from '../ui'

interface ErrorInfo {
  message: string
  code?: string
  details?: string
}

/**
 * FLAG DE BYPASS ADMIN
 * Coloque false para remover o acesso direto
 */
const ENABLE_ADMIN_BYPASS = true

export function LoginPage() {
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null)
  const [showErrorDetails, setShowErrorDetails] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorInfo(null)
    setShowErrorDetails(false)
    setIsLoading(true)

    const result = await login({ email, senha })

    if (!result.success) {
      setErrorInfo({
        message: result.error || 'Erro ao fazer login',
        code: result.errorCode,
        details: result.errorDetails
      })
    }

    setIsLoading(false)
  }

const handleAdminBypass = async () => {
  setIsLoading(true)

  // Simula login bem-sucedido no frontend
  localStorage.setItem(
    'autnew:user',
    JSON.stringify({
      id: 'admin',
      email: 'admin@autnew.com',
      role: 'admin',
      name: 'Administrador'
    })
  )

  localStorage.setItem('autnew:token', 'DEV_BYPASS_TOKEN')

  window.location.href = '/dashboard'
}


    if (!result.success) {
      setErrorInfo({
        message: result.error || 'Erro ao entrar como admin',
        code: result.errorCode,
        details: result.errorDetails
      })
    }

    setIsLoading(false)
  }

  const openDiagnostics = () => {
    window.open('/api/db-health', '_blank')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-purple/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-blue/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center shadow-lg"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-3xl font-bold text-text-primary mb-2">AUTNEW</h1>
          <p className="text-text-secondary">Sistema de Automação de Vídeos</p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-white/10 rounded-2xl p-8 shadow-xl"
        >
          <h2 className="text-xl font-semibold text-text-primary mb-6">
            Entrar no Sistema
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error */}
            {errorInfo && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-status-error/10 border border-status-error/30 rounded-xl"
              >
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-status-error mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-status-error">
                      {errorInfo.message}
                    </p>

                    {(errorInfo.code || errorInfo.details) && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowErrorDetails(!showErrorDetails)
                        }
                        className="mt-2 text-xs text-status-error/70 flex items-center gap-1"
                      >
                        {showErrorDetails ? (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            Ocultar detalhes
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            Ver detalhes
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {showErrorDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-status-error/20 space-y-2 text-xs">
                        {errorInfo.code && (
                          <div>
                            <strong>Código:</strong> {errorInfo.code}
                          </div>
                        )}
                        {errorInfo.details && (
                          <div>
                            <strong>Detalhes:</strong> {errorInfo.details}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={openDiagnostics}
                          className="flex items-center gap-1 text-accent-blue"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Abrir diagnóstico do banco
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <label className="text-sm flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Senha
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Admin Bypass */}
          {ENABLE_ADMIN_BYPASS && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                size="lg"
                onClick={handleAdminBypass}
                disabled={isLoading}
              >
                <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                Entrar direto como Admin
              </Button>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-text-secondary mt-6">
          AUTNEW Starter V1 - Mundo da Prece
        </p>
      </motion.div>
    </div>
  )
}
