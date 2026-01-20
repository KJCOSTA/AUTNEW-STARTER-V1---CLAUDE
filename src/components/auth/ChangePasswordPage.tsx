import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button, Input } from '../ui'

export function ChangePasswordPage() {
  const { user, changePassword, logout } = useAuth()
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const senhasMatch = novaSenha === confirmarSenha
  const senhaValida = novaSenha.length >= 6

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!senhasMatch) {
      setError('As senhas não coincidem')
      return
    }

    if (!senhaValida) {
      setError('A nova senha deve ter pelo menos 6 caracteres')
      return
    }

    setIsLoading(true)

    const result = await changePassword(senhaAtual, novaSenha)

    if (!result.success) {
      setError(result.error || 'Erro ao trocar senha')
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
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-status-warning to-amber-600 flex items-center justify-center shadow-lg"
          >
            <ShieldCheck className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Troca de Senha Obrigatória</h1>
          <p className="text-text-secondary">
            Olá, {user?.nome}! Por segurança, você deve trocar sua senha no primeiro acesso.
          </p>
        </div>

        {/* Change Password Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-white/10 rounded-2xl p-8 shadow-xl"
        >
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

            {/* Current Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                <Lock className="w-4 h-4 text-text-secondary" />
                Senha Atual
              </label>
              <div className="relative">
                <Input
                  type={showPasswords ? 'text' : 'password'}
                  placeholder="Digite sua senha atual"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                <Lock className="w-4 h-4 text-accent-purple" />
                Nova Senha
              </label>
              <Input
                type={showPasswords ? 'text' : 'password'}
                placeholder="Digite sua nova senha"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
              />
              {novaSenha && (
                <div className={`text-xs flex items-center gap-1 ${senhaValida ? 'text-status-success' : 'text-status-warning'}`}>
                  {senhaValida ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {senhaValida ? 'Senha válida' : 'Mínimo 6 caracteres'}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                <Lock className="w-4 h-4 text-accent-blue" />
                Confirmar Nova Senha
              </label>
              <Input
                type={showPasswords ? 'text' : 'password'}
                placeholder="Confirme sua nova senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
              />
              {confirmarSenha && (
                <div className={`text-xs flex items-center gap-1 ${senhasMatch ? 'text-status-success' : 'text-status-error'}`}>
                  {senhasMatch ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {senhasMatch ? 'Senhas coincidem' : 'Senhas não coincidem'}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading || !senhaAtual || !senhaValida || !senhasMatch}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                'Salvar Nova Senha'
              )}
            </Button>
          </form>

          {/* Logout option */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <button
              onClick={logout}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Sair e voltar ao login
            </button>
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
