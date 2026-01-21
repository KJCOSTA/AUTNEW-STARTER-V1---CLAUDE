import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, AlertOctagon, Terminal, RefreshCw, Check, X, 
  Key, ArrowRight, Database, ExternalLink, Activity, Mic, Video, Image, Cpu
} from 'lucide-react'

// Lista Completa de Serviços
const SERVICES = [
  { id: 'database', name: 'Banco de Dados', icon: Database, required: true },
  { id: 'gemini', name: 'Gemini AI', icon: Cpu, required: true },
  { id: 'youtube', name: 'YouTube API', icon: Video, required: true },
  { id: 'elevenlabs', name: 'ElevenLabs', icon: Mic, required: true },
  { id: 'json2video', name: 'JSON2Video', icon: Video, required: false },
  { id: 'openai', name: 'OpenAI', icon: Cpu, required: false },
  { id: 'pexels', name: 'Pexels', icon: Image, required: false },
  { id: 'pixabay', name: 'Pixabay', icon: Image, required: false },
  { id: 'stability', name: 'Stability AI', icon: Image, required: false },
]

export function SystemCheck({ onComplete }: { onComplete: () => void }) {
  const [results, setResults] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [manualKeys, setManualKeys] = useState<Record<string, string>>({})
  const [testingKey, setTestingKey] = useState<string | null>(null)
  
  const runFullCheck = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/system-check')
      const data = await res.json()
      setResults(data.results || {})
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  useEffect(() => { runFullCheck() }, [])

  const testManualKey = async (serviceId: string) => {
    const key = manualKeys[serviceId]
    if (!key) return
    setTestingKey(serviceId)
    try {
      const res = await fetch('/api/system-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: serviceId, key })
      })
      const data = await res.json()
      setResults(prev => ({ ...prev, [serviceId]: { ...data, manualOverride: true, usedKey: key } }))
    } catch (e) { console.error(e) } 
    finally { setTestingKey(null) }
  }

  const allRequiredPassed = SERVICES.filter(s => s.required).every(s => results[s.id]?.success)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <ShieldCheck className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              System Diagnostics V3
            </h1>
            <p className="text-zinc-500 text-sm">Verificação em Tempo Real & Correção de Chaves</p>
          </div>
        </div>
        <button onClick={runFullCheck} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-50">
          <RefreshCw className={\`w-4 h-4 \${loading ? 'animate-spin' : ''}\`} /> Re-Check
        </button>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
        {SERVICES.map((service) => {
          const result = results[service.id]
          const status = loading ? 'loading' : (result?.success ? 'success' : 'error')
          
          return (
            <div key={service.id} className={\`relative overflow-hidden rounded-xl border p-4 transition-all \${status === 'success' ? 'bg-zinc-900/50 border-green-900/30' : status === 'error' ? 'bg-red-950/10 border-red-900/30' : 'bg-zinc-900 border-zinc-800'}\`}>
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className={\`p-2 rounded-lg \${status === 'success' ? 'bg-green-500/10' : status === 'error' ? 'bg-red-500/10' : 'bg-zinc-800'}\`}>
                    <service.icon className={\`w-5 h-5 \${status === 'success' ? 'text-green-400' : status === 'error' ? 'text-red-400' : 'text-zinc-500'}\`} />
                  </div>
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {service.name}
                      {service.required && <span className="text-[10px] uppercase bg-zinc-800 text-zinc-400 px-2 rounded">Required</span>}
                    </h3>
                    <div className="text-xs text-zinc-400 mt-1">
                      {status === 'loading' && 'Verificando...'}
                      {status === 'success' && <span className="text-green-400 flex items-center gap-1"><Check className="w-3 h-3"/> OK ({result?.duration}ms)</span>}
                      {status === 'error' && <span className="text-red-400 flex items-center gap-1"><X className="w-3 h-3"/> {result?.message || 'Erro'}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Manual para Correção */}
              {status === 'error' && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 pt-3 border-t border-red-900/20">
                  <label className="text-[10px] text-red-300 font-bold uppercase mb-1 block">Corrigir API Key:</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Cole a chave nova aqui..."
                      value={manualKeys[service.id] || ''}
                      onChange={(e) => setManualKeys(p => ({...p, [service.id]: e.target.value}))}
                      className="flex-1 bg-black border border-zinc-800 rounded px-2 py-1 text-xs focus:border-purple-500 outline-none"
                    />
                    <button 
                      onClick={() => testManualKey(service.id)}
                      disabled={testingKey === service.id || !manualKeys[service.id]}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs"
                    >
                      {testingKey === service.id ? '...' : 'Testar'}
                    </button>
                  </div>
                  {result?.manualOverride && (
                    <div className="mt-2 text-xs text-green-400 bg-green-900/20 p-2 rounded border border-green-900/30">
                      ✅ Chave validada! Copie e salve na Vercel.
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )
        })}
      </div>

      <div className="w-full max-w-4xl mt-8 flex justify-end gap-4 pb-12">
        <button onClick={() => window.open('https://vercel.com/dashboard', '_blank')} className="px-6 py-3 bg-zinc-900 text-zinc-400 border border-zinc-800 rounded-xl hover:bg-zinc-800 flex items-center gap-2">
          Abrir Vercel <ExternalLink className="w-4 h-4" />
        </button>
        <button onClick={onComplete} className={\`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition \${allRequiredPassed ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20' : 'bg-zinc-800 text-zinc-400'}\`}>
          {allRequiredPassed ? 'Acessar Sistema' : 'Entrar Offline'} <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
