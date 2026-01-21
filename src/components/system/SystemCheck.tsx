import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, RefreshCw, CheckCircle2, XCircle, ArrowRight, Database, Wifi, Activity, Zap, Video } from 'lucide-react'

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

  // No modo SMART, permitimos entrada mesmo com erro
  const passed = SERVICES.filter(s => s.required).every(s => results[s.id]?.success)

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
           <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">System Check</h1>
           <p className="text-zinc-400 mb-8">
             {passed ? 'Todos os sistemas operacionais.' : 'Alguns sistemas não responderam, mas você pode usar o Modo Smart (Inserir chaves manualmente).'}
           </p>
           
           <button 
             onClick={onComplete}
             className="w-full py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2
               bg-white text-black hover:bg-zinc-200 shadow-xl shadow-white/10"
           >
             {passed ? 'Acessar Sistema' : 'Entrar (Modo Smart)'} <ArrowRight />
           </button>
        </div>

        <div className="space-y-3">
          {SERVICES.map(s => {
             const res = results[s.id]
             const ok = res?.success
             return (
               <div key={s.id} className={`p-4 rounded-lg border flex justify-between items-center ${ok ? 'border-green-900/50 bg-green-900/10' : 'border-red-900/50 bg-red-900/10'}`}>
                 <div className="flex items-center gap-3">
                   <s.icon className={`w-5 h-5 ${ok ? 'text-green-500' : 'text-red-500'}`} />
                   <span className="font-medium">{s.name}</span>
                 </div>
                 {loading ? <RefreshCw className="animate-spin w-4 h-4 text-zinc-500"/> : (ok ? <CheckCircle2 className="text-green-500"/> : <XCircle className="text-red-500"/>)}
               </div>
             )
          })}
        </div>
      </div>
    </div>
  )
}
