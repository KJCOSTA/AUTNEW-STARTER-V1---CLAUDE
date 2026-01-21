import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, CheckCircle2, XCircle, ArrowRight, Database, Wifi, Activity, Zap } from 'lucide-react'

const SERVICES = [
  { id: 'database', name: 'Banco de Dados', icon: Database, required: true },
  { id: 'gemini', name: 'Gemini AI', icon: Zap, required: true },
  { id: 'youtube', name: 'YouTube API', icon: Wifi, required: true },
  { id: 'openai', name: 'OpenAI', icon: Activity, required: false },
]

export function SystemCheck({ onComplete }: { onComplete: () => void }) {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(true)

  const runCheck = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/system-check')
      const data = await res.json()
      setResults(data.results || {})
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { runCheck() }, [])

  const passed = SERVICES.filter(s => s.required).every(s => results[s.id]?.success)

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-sans">
      <motion.div initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} className="w-full max-w-2xl bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl backdrop-blur-xl">
        <div className="flex justify-between items-center mb-8">
           <div>
             <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">System Status</h1>
             <p className="text-zinc-500 text-sm">Verificação de integridade operacional</p>
           </div>
           <button onClick={runCheck} disabled={loading} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition">
             <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
           </button>
        </div>

        <div className="space-y-3 mb-8">
          {SERVICES.map(s => {
             const res = results[s.id]
             const ok = res?.success
             const status = loading ? 'loading' : (ok ? 'ok' : 'error')
             
             return (
               <div key={s.id} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-zinc-800">
                 <div className="flex items-center gap-4">
                   <div className={`p-2 rounded-lg ${status === 'ok' ? 'bg-green-500/10 text-green-500' : status === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-zinc-800 text-zinc-500'}`}>
                     <s.icon className="w-5 h-5" />
                   </div>
                   <span className="font-medium text-zinc-200">{s.name}</span>
                 </div>
                 {status === 'loading' && <div className="w-2 h-2 bg-zinc-500 rounded-full animate-pulse" />}
                 {status === 'ok' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                 {status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
               </div>
             )
          })}
        </div>

        <button 
          onClick={onComplete}
          className="w-full py-4 rounded-xl font-bold text-lg bg-white text-black hover:bg-zinc-200 transition flex items-center justify-center gap-2 shadow-lg shadow-white/5"
        >
          Acessar Sistema <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  )
}
