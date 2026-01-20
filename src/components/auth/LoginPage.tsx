import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Zap } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button, Input } from '../ui'

export function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const result = await login({ email, senha })

    if (!result.success) {
      setError(result.error || 'Erro ao fazer login')
    }

    setIsLoading(false)
  }

  // Entrar diretamente como admin (modo desenvolvimento)
  const handleDevLogin = async () => {
    setError('')
    setIsLoading(true)
    const result = await login({ email: 'kleiton@autnew.com', senha: 'jangada' })
    if (!result.success) {
      setError(result.error || 'Erro ao fazer login')
    }
    setIsLoading(false)
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
        {/* Logo & Title */}
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

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-white/10 rounded-2xl p-8 shadow-xl"
        >
          <h2 className="text-xl font-semibold text-text-primary mb-6">Entrar no Sistema</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-status-error/10 border border-status-error/30 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0 mt-0.5" />
                <p className="text-sm text-status-error">{error}</p>
              </motion.div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                <Mail className="w-4 h-4 text-text-secondary" />
                Email
              </label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                <Lock className="w-4 h-4 text-text-secondary" />
                Senha
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading || !email || !senha}
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

          {/* Dev Login Button */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              size="lg"
              onClick={handleDevLogin}
              disabled={isLoading}
            >
              <Zap className="w-5 h-5 mr-2 text-yellow-400" />
              Entrar como Admin (Dev)
            </Button>
            <p className="text-xs text-text-secondary text-center mt-3">
              Modo desenvolvimento - acesso direto sem credenciais
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-text-secondary mt-6">
          AUTNEW Starter V1 - Mundo da Prece
        </p>
      </motion.div>
    </div>
  )
}
