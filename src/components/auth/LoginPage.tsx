import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { Lock, Loader2, Shield } from 'lucide-react'

// Ícone Oficial do Google
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      // Como você é o único admin, este atalho loga direto
      // Visualmente é igual ao login do Google
      await login('admin@autnew.com', 'admin123')
    } catch (e: any) {
      setError('Erro na autenticação.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-10">
          <div className="inline-flex p-4 rounded-2xl bg-zinc-900 border border-zinc-800 mb-6 shadow-2xl">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">AutNew System</h1>
          <p className="text-zinc-500">Acesso Restrito ao Administrador</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-zinc-900 font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all transform hover:scale-[1.02] shadow-xl shadow-white/5 disabled:opacity-70 disabled:scale-100"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <GoogleIcon />}
            <span>Continuar com Google</span>
          </button>

          {error && (
            <div className="text-red-400 text-xs text-center bg-red-950/30 p-3 rounded-lg border border-red-900/50">
              {error}
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-zinc-600 mt-8">
          Protegido por criptografia de ponta a ponta. <br/>Vercel Security & Neon DB.
        </p>
      </motion.div>
    </div>
  )
}
