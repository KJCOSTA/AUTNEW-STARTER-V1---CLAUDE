import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { Loader2, Mail, Lock, AlertTriangle, LogIn } from 'lucide-react'

export function LoginPage() {
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!email || !senha) return setError('Preencha todos os campos')

    setLoading(true)
    setError('')

    try {
      console.log('[LOGIN] Attempting login for:', email)
      const res = await login({ email, password: senha })
      console.log('[LOGIN] Login result:', { success: res.success, error: res.error })

      if (!res.success) {
        console.error('[LOGIN] Login failed:', res.error)
        setError(res.error || 'Falha ao entrar')
        setLoading(false)
      } else {
        console.log('[LOGIN] Login successful, redirecting...')
        // Sucesso! O redirecionamento acontece via AuthContext/App
        // Não forçar reload - deixar o React controlar o estado
        // O App.tsx vai detectar isAuthenticated e renderizar o dashboard
      }
    } catch (e) {
      console.error('[LOGIN] Login error:', e)
      setError('Erro de conexão')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] p-4 font-sans text-white relative overflow-hidden">
      {/* Efeito de fundo sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,50,255,0.1),transparent)] pointer-events-none" />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="w-full max-w-sm bg-[#0f172a] border border-[#1e293b] p-8 rounded-2xl shadow-2xl z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-xl bg-purple-500/10 mb-4 border border-purple-500/20">
            <LogIn className="w-6 h-6 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Bem-vindo</h1>
          <p className="text-[#64748b] text-sm mt-1">Insira suas credenciais de acesso</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#64748b] ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-[#64748b]"/>
              <input 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full bg-[#1e293b] border border-transparent focus:border-purple-500 rounded-xl py-3 pl-10 text-sm focus:ring-0 outline-none transition-all placeholder:text-[#334155]" 
                placeholder="admin@autnew.com" 
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#64748b] ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-[#64748b]"/>
              <input 
                type="password" 
                value={senha} 
                onChange={e => setSenha(e.target.value)} 
                className="w-full bg-[#1e293b] border border-transparent focus:border-purple-500 rounded-xl py-3 pl-10 text-sm focus:ring-0 outline-none transition-all placeholder:text-[#334155]" 
                placeholder="••••••••" 
              />
            </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-xs bg-red-500/10 p-3 rounded-lg flex items-center gap-2 border border-red-500/20">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center shadow-lg shadow-purple-900/20 mt-2"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5"/> : 'Entrar no Sistema'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-[10px] text-[#475569]">
          Protegido por Neon DB & Vercel Security
        </div>
      </motion.div>
    </div>
  )
}
