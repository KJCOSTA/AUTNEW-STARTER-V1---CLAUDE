import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, RefreshCw, CheckCircle2, XCircle, ArrowRight, 
  Database, Wifi, Activity, Zap, Video, Image, Terminal
} from 'lucide-react'

const GROUPS = [
  {
    name: "Infraestrutura Core",
    items: [
      { id: 'database', name: 'Neon Postgres', icon: Database, required: true },
    ]
  },
  {
    name: "Inteligência Artificial",
    items: [
      { id: 'gemini', name: 'Google Gemini 2.0', icon: Zap, required: true },
      { id: 'openai', name: 'OpenAI GPT-4', icon: Activity, required: false },
      { id: 'elevenlabs', name: 'ElevenLabs Voice', icon: Wifi, required: true },
    ]
  },
  {
    name: "Mídia & Integrações",
    items: [
      { id: 'youtube', name: 'YouTube Data API', icon: Video, required: true },
      { id: 'json2video', name: 'JSON2Video Render', icon: Video, required: false },
      { id: 'pexels', name: 'Pexels Stock', icon: Image, required: false },
      { id: 'pixabay', name: 'Pixabay Stock', icon: Image, required: false },
    ]
  }
]

export function SystemCheck({ onComplete }: { onComplete: () => void }) {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<string[]>([])
  const [systemInfo, setSystemInfo] = useState<any>({})

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-4), `> ${msg}`])

  const runCheck = async () => {
    setLoading(true)
    setLogs([])
    addLog('Iniciando protocolo de diagnóstico...')
    
    try {
      const start = Date.now()
      const res = await fetch('/api/system-check')
      const data = await res.json()
      
      setSystemInfo({ region: data.region, env: data.environment })
      setResults(data.results || {})
      
      addLog(`Diagnóstico concluído em ${Date.now() - start}ms`)
    } catch(e: any) { 
      console.error(e)
      addLog('ERRO FATAL NA COMUNICAÇÃO COM O SERVIDOR')
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { runCheck() }, [])

  const allServices = GROUPS.flatMap(g => g.items)
  const requiredServices = allServices.filter(s => s.required)
  
  const successCount = Object.values(results).filter((r: any) => r.success).length
  const totalChecked = Object.keys(results).length || 1
  const healthPercent = Math.round((successCount / totalChecked) * 100)
  
  const criticalFailure = requiredServices.some(s => results[s.id] && !results[s.id].success && !results[s.id].missingEnv)

  return (
    <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-surface-dark/50 border border-surface-light p-6 rounded-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary-DEFAULT/10 rounded-lg border border-primary-DEFAULT/20">
                <ShieldCheck className="w-8 h-8 text-primary-DEFAULT" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">System Status</h1>
                <p className="text-xs text-secondary uppercase tracking-wider">Vercel {systemInfo.env || 'Production'}</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm text-secondary">Integridade</span>
                <span className="text-2xl font-bold text-white">{healthPercent}%</span>
              </div>
              <div className="h-2 bg-surface-light rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${healthPercent}%` }}
                  className={`h-full ${healthPercent > 80 ? 'bg-success' : healthPercent > 50 ? 'bg-warning' : 'bg-error'}`}
                />
              </div>
            </div>

            <button 
              onClick={onComplete}
              className={`w-full py-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg ${
                criticalFailure 
                  ? 'bg-surface-light text-secondary hover:bg-surface-hover' 
                  : 'bg-white text-black hover:bg-gray-200 shadow-white/10'
              }`}
            >
              ACESSAR PAINEL <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          <div className="bg-black border border-surface-light rounded-xl p-4 h-48 overflow-hidden font-mono text-[10px] text-green-500/80 shadow-inner">
            <div className="flex items-center gap-2 mb-2 text-secondary border-b border-surface-light pb-2">
              <Terminal className="w-3 h-3" /> SYSTEM_LOGS
            </div>
            <div className="flex flex-col justify-end h-full pb-6">
              <AnimatePresence>
                {logs.map((log, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="truncate">
                    {log}
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity }}>_</motion.div>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {GROUPS.map((group, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}>
              <h3 className="text-xs font-bold text-secondary uppercase mb-3 ml-1 tracking-widest">{group.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.items.map((s) => {
                  const res = results[s.id]
                  const status = loading ? 'loading' : (res?.success ? 'success' : (res?.missingEnv ? 'warning' : 'error'))
                  return (
                    <div key={s.id} className={`relative p-4 rounded-xl border flex items-center justify-between transition-all duration-300 ${status === 'success' ? 'bg-success/5 border-success/20' : status === 'error' ? 'bg-error/5 border-error/20' : 'bg-surface-dark border-surface-light'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${status === 'success' ? 'bg-success/10 text-success' : status === 'error' ? 'bg-error/10 text-error' : 'bg-surface-light text-secondary'}`}>
                          <s.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white">{s.name}</div>
                          <div className="text-[10px] text-secondary uppercase">
                            {status === 'loading' && 'Verificando...'}
                            {status === 'success' && `ONLINE • ${res.latency}ms`}
                            {status === 'error' && `FALHA: ${res.message}`}
                            {status === 'warning' && 'NÃO CONFIGURADO'}
                          </div>
                        </div>
                      </div>
                      {status === 'success' && <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]" />}
                      {status === 'error' && <div className="w-2 h-2 rounded-full bg-error" />}
                      {status === 'loading' && <RefreshCw className="w-3 h-3 text-secondary animate-spin" />}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ))}
          <div className="flex justify-end">
             <button onClick={runCheck} disabled={loading} className="text-xs text-secondary hover:text-white flex items-center gap-2 transition">
               <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Atualizar Diagnóstico
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}
