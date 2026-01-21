import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, RefreshCw, CheckCircle2, XCircle, ArrowRight, 
  Database, Wifi, Activity, Zap, Video, Image, Server, Terminal
} from 'lucide-react'

// Definição Visual dos Serviços
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
      
      addLog(\`Diagnóstico concluído em \${Date.now() - start}ms\`)
    } catch(e: any) { 
      console.error(e)
      addLog('ERRO FATAL NA COMUNICAÇÃO COM O SERVIDOR')
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { runCheck() }, [])

  // Flatten services para verificação rápida
  const allServices = GROUPS.flatMap(g => g.items)
  const requiredServices = allServices.filter(s => s.required)
  
  // Cálculo de Saúde do Sistema
  const successCount = Object.values(results).filter((r: any) => r.success).length
  const totalChecked = Object.keys(results).length || 1
  const healthPercent = Math.round((successCount / totalChecked) * 100)
  
  const criticalFailure = requiredServices.some(s => results[s.id] && !results[s.id].success && !results[s.id].missingEnv)

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA 1: Status Geral & Ações */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <ShieldCheck className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">System Status</h1>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Vercel {systemInfo.env || 'Production'}</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm text-zinc-400">Integridade</span>
                <span className="text-2xl font-bold text-white">{healthPercent}%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: \`\${healthPercent}%\` }}
                  className={\`h-full \${healthPercent > 80 ? 'bg-green-500' : healthPercent > 50 ? 'bg-yellow-500' : 'bg-red-500'}\`}
                />
              </div>
            </div>

            <div className="space-y-2 text-xs text-zinc-500 mb-6 border-t border-zinc-800 pt-4">
              <div className="flex justify-between">
                <span>Region</span>
                <span className="text-zinc-300">{systemInfo.region?.toUpperCase() || 'US-EAST'}</span>
              </div>
              <div className="flex justify-between">
                <span>Latency</span>
                <span className="text-zinc-300">{results.database?.latency || 0}ms</span>
              </div>
            </div>

            <button 
              onClick={onComplete}
              className={\`w-full py-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg \${
                criticalFailure 
                  ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' 
                  : 'bg-white text-black hover:bg-zinc-200 shadow-white/10'
              }\`}
            >
              ACESSAR PAINEL <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Console Log Visual */}
          <div className="bg-black border border-zinc-800 rounded-xl p-4 h-48 overflow-hidden font-mono text-[10px] text-green-500/80 shadow-inner">
            <div className="flex items-center gap-2 mb-2 text-zinc-600 border-b border-zinc-900 pb-2">
              <Terminal className="w-3 h-3" /> SYSTEM_LOGS
            </div>
            <div className="flex flex-col justify-end h-full pb-6">
              <AnimatePresence>
                {logs.map((log, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="truncate"
                  >
                    {log}
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity }}>_</motion.div>}
            </div>
          </div>
        </div>

        {/* COLUNA 2 & 3: Grid de Serviços */}
        <div className="lg:col-span-2 space-y-6">
          {GROUPS.map((group, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3 ml-1 tracking-widest">{group.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.items.map((s) => {
                  const res = results[s.id]
                  const status = loading ? 'loading' : (res?.success ? 'success' : (res?.missingEnv ? 'warning' : 'error'))
                  
                  return (
                    <div 
                      key={s.id} 
                      className={\`
                        relative p-4 rounded-xl border flex items-center justify-between transition-all duration-300
                        \${status === 'success' ? 'bg-green-500/5 border-green-500/20' : ''}
                        \${status === 'error' ? 'bg-red-500/5 border-red-500/20' : ''}
                        \${status === 'warning' ? 'bg-zinc-900 border-zinc-800 opacity-60' : ''}
                        \${status === 'loading' ? 'bg-zinc-900 border-zinc-800' : ''}
                      \`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={\`p-2 rounded-lg \${status === 'success' ? 'bg-green-500/10 text-green-400' : status === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-500'}\`}>
                          <s.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-zinc-200">{s.name}</div>
                          <div className="text-[10px] text-zinc-500 uppercase">
                            {status === 'loading' && 'Verificando...'}
                            {status === 'success' && \`ONLINE • \${res.latency}ms\`}
                            {status === 'error' && \`FALHA: \${res.message}\`}
                            {status === 'warning' && 'NÃO CONFIGURADO'}
                          </div>
                        </div>
                      </div>
                      
                      {status === 'success' && <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />}
                      {status === 'error' && <div className="w-2 h-2 rounded-full bg-red-500" />}
                      {status === 'loading' && <RefreshCw className="w-3 h-3 text-zinc-600 animate-spin" />}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ))}
          
          <div className="flex justify-end">
             <button onClick={runCheck} disabled={loading} className="text-xs text-zinc-500 hover:text-white flex items-center gap-2 transition">
               <RefreshCw className={\`w-3 h-3 \${loading ? 'animate-spin' : ''}\`} /> Atualizar Diagnóstico
             </button>
          </div>
        </div>

      </div>
    </div>
  )
}
