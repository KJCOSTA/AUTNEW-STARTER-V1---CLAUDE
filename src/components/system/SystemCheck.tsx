import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, AlertOctagon, Terminal, RefreshCw, Check, X, 
  Key, ArrowRight, Database, ExternalLink, Activity
} from 'lucide-react'

// Definição dos serviços
const SERVICES = [
  { id: 'database', name: 'Banco de Dados (Neon)', icon: Database, required: true },
  { id: 'gemini', name: 'Google Gemini AI', icon: Activity, required: true },
  { id: 'youtube', name: 'YouTube Data API', icon: Activity, required: true },
  { id: 'openai', name: 'OpenAI (GPT)', icon: Activity, required: false },
  { id: 'elevenlabs', name: 'ElevenLabs TTS', icon: Activity, required: false },
  { id: 'json2video', name: 'JSON2Video', icon: Activity, required: false },
  { id: 'pexels', name: 'Pexels Imagens', icon: Activity, required: false },
  { id: 'pixabay', name: 'Pixabay Imagens', icon: Activity, required: false },
  { id: 'stability', name: 'Stability AI', icon: Activity, required: false },
  { id: 'telegram', name: 'Telegram Bot', icon: Activity, required: false },
]

export function SystemCheck({ onComplete }: { onComplete: () => void }) {
  const [results, setResults] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [manualKeys, setManualKeys] = useState<Record<string, string>>({})
  const [testingKey, setTestingKey] = useState<string | null>(null)
  
  // Executa o diagnóstico inicial
  const runFullCheck = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/system-check')
      const data = await res.json()
      setResults(data.results || {})
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { runFullCheck() }, [])

  // Testa uma chave manual inserida pelo usuário
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
      
      // Atualiza o resultado localmente para mostrar sucesso
      setResults(prev => ({
        ...prev,
        [serviceId]: { ...data, manualOverride: true, usedKey: key }
      }))
    } catch (e) {
      console.error(e)
    } finally {
      setTestingKey(null)
    }
  }

  const allRequiredPassed = SERVICES
    .filter(s => s.required)
    .every(s => results[s.id]?.success)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans p-4 md:p-8 flex flex-col items-center">
      
      {/* Header */}
      <div className="w-full max-w-4xl mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <ShieldCheck className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              System Diagnostics
            </h1>
            <p className="text-zinc-500 text-sm">Verificando integridade das conexões e APIs</p>
          </div>
        </div>
        <button 
          onClick={runFullCheck}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Re-Check
        </button>
      </div>

      {/* Grid de Serviços */}
      <div className="w-full max-w-4xl grid grid-cols-1 gap-4">
        {SERVICES.map((service) => {
          const result = results[service.id]
          const status = loading ? 'loading' : (result?.success ? 'success' : 'error')
          const isManualSuccess = result?.manualOverride

          return (
            <motion.div 
              key={service.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                relative overflow-hidden rounded-xl border p-5 transition-all
                ${status === 'success' ? 'bg-zinc-900/50 border-green-900/30' : ''}
                ${status === 'error' ? 'bg-red-950/10 border-red-900/30' : ''}
                ${status === 'loading' ? 'bg-zinc-900 border-zinc-800' : ''}
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${status === 'success' ? 'bg-green-500/10' : status === 'error' ? 'bg-red-500/10' : 'bg-zinc-800'}`}>
                    <service.icon className={`w-5 h-5 ${status === 'success' ? 'text-green-400' : status === 'error' ? 'text-red-400' : 'text-zinc-500'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {service.name}
                      {service.required && <span className="text-[10px] uppercase bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">Obrigatório</span>}
                    </h3>
                    <div className="text-sm text-zinc-400 mt-1 flex items-center gap-2">
                      {status === 'loading' && 'Verificando...'}
                      {status === 'success' && <span className="text-green-400 flex items-center gap-1"><Check className="w-3 h-3"/> Operacional ({result?.duration}ms)</span>}
                      {status === 'error' && <span className="text-red-400 flex items-center gap-1"><X className="w-3 h-3"/> {result?.message || 'Falha na conexão'}</span>}
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2">
                   {isManualSuccess && (
                     <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">Chave Manual Validada</span>
                   )}
                </div>
              </div>

              {/* Área de Correção Manual (Aparece apenas se der erro e não estiver carregando) */}
              <AnimatePresence>
                {status === 'error' && !loading && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-4 pt-4 border-t border-red-900/20"
                  >
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-red-300 font-medium">
                        CORREÇÃO RÁPIDA: Insira uma chave válida para testar agora
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Key className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                          <input 
                            type="text" 
                            placeholder="Cole sua API Key aqui..."
                            value={manualKeys[service.id] || ''}
                            onChange={(e) => setManualKeys(prev => ({...prev, [service.id]: e.target.value}))}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-9 pr-4 text-sm focus:ring-1 focus:ring-purple-500 outline-none"
                          />
                        </div>
                        <button 
                          onClick={() => testManualKey(service.id)}
                          disabled={testingKey === service.id || !manualKeys[service.id]}
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition disabled:opacity-50 min-w-[100px]"
                        >
                          {testingKey === service.id ? 'Testando...' : 'Testar'}
                        </button>
                      </div>
                      
                      {/* Instruções se a chave manual funcionar */}
                      {isManualSuccess && (
                        <div className="mt-2 p-3 bg-green-900/20 border border-green-900/30 rounded-lg flex items-start gap-3">
                          <Terminal className="w-5 h-5 text-green-400 mt-0.5" />
                          <div className="text-sm">
                            <p className="text-green-300 font-bold">Chave validada com sucesso!</p>
                            <p className="text-green-400/80 mb-2">Para tornar essa correção permanente:</p>
                            <ol className="list-decimal list-inside text-zinc-400 space-y-1">
                              <li>Vá para o painel da <strong>Vercel</strong></li>
                              <li>Entre em <strong>Settings {'>'} Environment Variables</strong></li>
                              <li>Atualize a chave <code>{service.id.toUpperCase()}_API_KEY</code></li>
                              <li>Redeploy o projeto.</li>
                            </ol>
                            <button 
                              onClick={() => navigator.clipboard.writeText(result.usedKey)}
                              className="mt-2 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-300 px-3 py-1.5 rounded transition"
                            >
                              Copiar Chave para Clipboard
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Footer Actions */}
      <div className="w-full max-w-4xl mt-8 flex justify-end gap-4 pb-12">
        <button 
           onClick={() => window.open('https://vercel.com/dashboard', '_blank')}
           className="px-6 py-3 bg-zinc-900 text-zinc-400 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition flex items-center gap-2"
        >
          Abrir Vercel <ExternalLink className="w-4 h-4" />
        </button>

        {allRequiredPassed ? (
          <button 
            onClick={onComplete}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition flex items-center gap-2"
          >
            Acessar Sistema <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button 
            onClick={onComplete}
            className="px-6 py-3 bg-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-700 transition flex items-center gap-2"
          >
            Entrar em Modo Offline (Restrito) <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
