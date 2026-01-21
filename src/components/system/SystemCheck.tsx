import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, RefreshCw, Check, X, Database, Video, Image, Cpu, Mic } from 'lucide-react'

const SERVICES = [
  { id: 'database', name: 'Banco de Dados', icon: Database, required: true },
  { id: 'gemini', name: 'Gemini AI', icon: Cpu, required: true },
  { id: 'youtube', name: 'YouTube API', icon: Video, required: true },
  { id: 'elevenlabs', name: 'ElevenLabs', icon: Mic, required: true },
  { id: 'openai', name: 'OpenAI', icon: Cpu, required: false },
  { id: 'json2video', name: 'JSON2Video', icon: Video, required: false },
]

export function SystemCheck({ onComplete }: { onComplete: () => void }) {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [keys, setKeys] = useState<any>({})

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
    try {
      const res = await fetch('/api/system-check', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ service, key: keys[service] })
      })
      const data = await res.json()
      setResults((prev: any) => ({ ...prev, [service]: { ...data, manualOverride: true } }))
    } catch(e) { console.error(e) }
  }

  useEffect(() => { runCheck() }, [])
  const passed = SERVICES.filter(s => s.required).every(s => results[s.id]?.success)

  return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ShieldCheck className="text-purple-500" /> Diagnóstico de Sistema
      </h1>
      
      <div className="grid gap-4 w-full max-w-2xl">
        {SERVICES.map(s => {
          const res = results[s.id]
          const status = loading ? '...' : (res?.success ? 'OK' : 'ERRO')
          
          return (
            <div key={s.id} className={`p-4 border rounded bg-zinc-900 ${res?.success ? 'border-green-900' : 'border-red-900'}`}>
               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                   <s.icon className="w-5 h-5 text-zinc-400" />
                   <span className="font-bold">{s.name}</span>
                 </div>
                 <div className={res?.success ? 'text-green-400' : 'text-red-400'}>{status}</div>
               </div>
               
               {!loading && !res?.success && (
                 <div className="mt-2 flex gap-2">
                   <input 
                     className="bg-black border border-zinc-700 p-1 text-sm rounded flex-1"
                     placeholder="Cole a chave correta aqui..."
                     onChange={e => setKeys({...keys, [s.id]: e.target.value})}
                   />
                   <button onClick={() => testKey(s.id)} className="bg-zinc-700 px-3 py-1 rounded text-sm">Testar</button>
                 </div>
               )}
            </div>
          )
        })}
      </div>

      <div className="mt-8 flex gap-4">
        <button onClick={runCheck} className="px-4 py-2 bg-zinc-800 rounded flex items-center gap-2"><RefreshCw className="w-4 h-4"/> Re-scan</button>
        <button onClick={onComplete} className={`px-6 py-2 rounded font-bold ${passed ? 'bg-purple-600' : 'bg-zinc-700'}`}>
          {passed ? 'Entrar no Sistema' : 'Entrar (Offline)'}
        </button>
      </div>
    </div>
  )
}
