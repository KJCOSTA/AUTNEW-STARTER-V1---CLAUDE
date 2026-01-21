import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { Loader2, Mail, Lock, Github, AlertTriangle } from 'lucide-react'

// Ícone Google
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26-1.19-.58z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
)

export function LoginPage() {
  const { login } = useAuth()
  const [loading, setLoading] = useState<'google' | 'github' | 'email' | null>(null)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')

  const handleFastLogin = async (provider: 'google' | 'github') => {
    setLoading(provider)
    setError('')
    try {
      // Chama o backend direto para bypass
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', provider })
      })
      
      if (!res.ok) {
         const errText = await res.text()
         throw new Error(errText || 'Falha na conexão')
      }

      const data = await res.json()
      
      if (data.success && data.token) {
         localStorage.setItem('autnew:token', data.token)
         localStorage.setItem('autnew:user', JSON.stringify(data.user))
         window.location.href = '/' // Força redirecionamento total
      } else {
         throw new Error(data.error || 'Login falhou')
      }
    } catch (e: any) {
      console.error(e)
      setError(`Erro: ${e.message}`)
      setLoading(null)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!email || !senha) return setError('Preencha email e senha')
    setLoading('email')
    
    // Agora enviamos 'password' explicitamente para o context/api
    const res = await login({ email, password: senha })
    
    if (!res.success) {
        setError(res.error || 'Credenciais inválidas')
        setLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] p-4 font-sans text-white">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm bg-[#0f172a] border border-[#1e293b] p-8 rounded-2xl shadow-2xl">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">AutNew</h1>
          <p className="text-[#64748b] text-sm">Acesso Administrativo</p>
        </div>

        <div className="space-y-3 mb-6">
          <button onClick={() => handleFastLogin('google')} disabled={!!loading} className="w-full flex items-center justify-center gap-3 p-3 rounded-xl bg-white text-black hover:bg-gray-100 font-bold transition disabled:opacity-50">
            {loading === 'google' ? <Loader2 className="animate-spin w-5 h-5"/> : <GoogleIcon />}
            Entrar com Google
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#1e293b]"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0f172a] px-2 text-[#64748b]">ou</span></div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-4 h-4 text-[#64748b]"/>
            <input value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#1e293b] border-none rounded-xl py-3 pl-10 text-sm focus:ring-2 focus:ring-purple-600" placeholder="admin@autnew.com" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-[#64748b]"/>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} className="w-full bg-[#1e293b] border-none rounded-xl py-3 pl-10 text-sm focus:ring-2 focus:ring-purple-600" placeholder="••••••••" />
          </div>

          {error && (
            <div className="text-red-400 text-xs bg-red-500/10 p-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          <button type="submit" disabled={!!loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 flex justify-center">
            {loading === 'email' ? <Loader2 className="animate-spin w-5 h-5"/> : 'Entrar'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
