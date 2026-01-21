import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { Lock, Mail, Loader2, PlayCircle, ShieldCheck } from 'lucide-react'

// Ícone do Google
function GoogleIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
        <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
        <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
        <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
        <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.799 L -6.734 42.379 C -8.804 40.439 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
      </g>
    </svg>
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Atalho Mágico para o Dono (Simula Login Google)
  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      // Como você é o único dono, usamos isso como atalho para o admin
      await login('admin@autnew.com', 'admin123')
    } catch (e: any) {
      setError('Erro na autenticação automática.')
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, senha)
    } catch (err: any) {
      setError(err.message || 'Falha no login')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-4">
            <Lock className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Bem-vindo ao AutNew</h1>
          <p className="text-zinc-400 text-sm">Painel de Controle Estratégico</p>
        </div>

        {/* Botão Google (Atalho) */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white text-black font-medium py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition mb-6"
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <GoogleIcon />}
          Entrar com Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-zinc-900 px-2 text-zinc-500">ou entre com email</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-purple-600 outline-none transition"
                placeholder="seu@email.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Senha</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-purple-600 outline-none transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <div className="text-red-400 text-xs bg-red-400/10 p-3 rounded-lg">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-800 text-zinc-300 font-medium py-3 rounded-xl hover:bg-zinc-700 transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Entrar Manualmente'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
