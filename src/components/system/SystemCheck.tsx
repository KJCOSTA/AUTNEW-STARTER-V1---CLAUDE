import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, RefreshCw, CheckCircle2, XCircle, 
  ArrowRight, Database, ExternalLink, Cpu, Wifi,
  Activity, Lock, Zap
} from 'lucide-react'

const SERVICES = [
  { id: 'database', name: 'Banco de Dados', icon: Database, required: true },
  { id: 'gemini', name: 'Gemini AI', icon: Cpu, required: true },
  { id: 'youtube', name: 'YouTube API', icon: Wifi, required: true },
  { id: 'elevenlabs', name: 'ElevenLabs', icon: Activity, required: true },
  { id: 'openai', name: 'OpenAI', icon: Zap, required: false },
  { id: 'json2video', name: 'JSON2Video', icon: VideoIcon, required: false },
]

function VideoIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
}

export function SystemCheck({ onComplete }: { onComplete: () => void }) {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [keys, setKeys] = useState<any>({})
  const [testing, setTesting] = useState<string | null>(null)

  const runCheck = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/system-check')
      const data = await res.json()
      setResults(data.results || {})
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const testKey = async (service: string) => {
    if (!keys[service]) return
    setTesting(service)
    try {
      const res = await fetch('/api/system-check', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ service, key: keys[service] })
      })
      const data = await res.json()
      setResults((prev: any) => ({ ...prev, [service]: { ...data, manualOverride: true } }))
    } catch(e) { console.error(e) }
    finally { setTesting(null) }
  }

  useEffect(() => { runCheck() }, [])
  const passed = SERVICES.filter(s => s.required).every(s => results[s.id]?.success)

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl z-10 grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {/* Left Panel: Status & Actions */}
        <div className="flex flex-col justify-center space-y-8">
          <div>
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-300 mb-4"
            >
              <Activity className="w-3 h-3" /> System Diagnostics V4
            </motion.div>
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-zinc-500 mb-4">
              Verificação<br/>de Sistemas
            </h1>
            <p className="text-zinc-400 text-lg max-w-md">
              O AUTNEW está executando testes de integridade em todas as APIs e conexões seguras.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={runCheck}
              disabled={loading}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Re-scan
            </button>

            {passed ? (
              <motion.button 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={onComplete}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-white font-bold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition flex items-center gap-2"
              >
                Acessar Sistema <ArrowRight className="w-5 h-5" />
              </motion.button>
            ) : (
              <button 
                onClick={onComplete}
                className="px-6 py-3 bg-zinc-800 text-zinc-500 rounded-xl font-medium flex items-center gap-2 hover:bg-zinc-700 hover:text-white transition"
              >
                Entrar Offline <Lock className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Panel: Cards Grid */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          
          <div className="space-y-3 relative z-10 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {SERVICES.map((s, i) => {
              const res = results[s.id]
              const status = loading ? 'loading' : (res?.success ? 'success' : 'error')
              
              return (
                <motion.div 
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`
                    p-4 rounded-xl border transition-all duration-300
                    ${status === 'success' ? 'bg-green-500/10 border-green-500/20' : ''}
                    ${status === 'error' ? 'bg-red-500/10 border-red-500/20' : ''}
                    ${status === 'loading' ? 'bg-white/5 border-white/5' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${status === 'success' ? 'bg-green-500/20 text-green-400' : status === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-zinc-400'}`}>
                        <s.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{s.name}</h3>
                        <p className="text-xs text-zinc-500">
                          {status === 'loading' && 'Verificando...'}
                          {status === 'success' && `Conectado (${res.duration}ms)`}
                          {status === 'error' && (res?.message || 'Falha na conexão')}
                        </p>
                      </div>
                    </div>
                    <div>
                      {status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                      {status === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
                    </div>
                  </div>

                  {/* Manual Fix Input */}
                  <AnimatePresence>
                    {status === 'error' && !loading && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-3 pt-3 border-t border-red-500/20"
                      >
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Cole a chave da API aqui..."
                            className="flex-1 bg-black/50 border border-red-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                            value={keys[s.id] || ''}
                            onChange={(e) => setKeys({...keys, [s.id]: e.target.value})}
                          />
                          <button 
                            onClick={() => testKey(s.id)}
                            disabled={testing === s.id}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs px-3 py-2 rounded-lg font-medium transition"
                          >
                            {testing === s.id ? '...' : 'Testar'}
                          </button>
                        </div>
                        {res?.manualOverride && (
                          <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Chave temporária validada!
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
