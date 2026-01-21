import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, Server, Database, Globe, RefreshCw, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { Card } from '../ui/Card'

export function Monitor() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      // Usa o endpoint de check robusto que criamos
      const res = await fetch('/api/system-check')
      if (!res.ok) throw new Error(\`Erro HTTP: \${res.status}\`)
      const data = await res.json()
      setStatus(data)
      setLastUpdate(new Date())
    } catch (e: any) {
      console.error('Monitor Error:', e)
      setError(e.message || 'Falha ao carregar status do sistema')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000) // Atualiza a cada 30s
    return () => clearInterval(interval)
  }, [])

  if (loading && !status) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
        <RefreshCw className="w-8 h-8 animate-spin mb-4 text-purple-500" />
        <p>Conectando ao servidor...</p>
      </div>
    )
  }

  if (error && !status) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-400">
        <AlertTriangle className="w-10 h-10 mb-4" />
        <h3 className="text-lg font-bold">Erro de Conexão</h3>
        <p className="text-sm">{error}</p>
        <button 
          onClick={fetchStatus}
          className="mt-4 px-4 py-2 bg-zinc-800 rounded hover:bg-zinc-700 text-white transition"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  const results = status?.results || {}
  
  // Função auxiliar para renderizar cards de status
  const StatusCard = ({ id, label, icon: Icon }: any) => {
    const item = results[id]
    const isOk = item?.success
    const isLoading = !item && loading

    return (
      <Card className="p-4 border border-white/5 bg-zinc-900/50">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 text-zinc-300">
            <Icon className="w-4 h-4" />
            <span className="font-medium">{label}</span>
          </div>
          <div className={\`w-2 h-2 rounded-full \${isOk ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}\`} />
        </div>
        
        <div className="mt-2">
          {isLoading ? (
            <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
          ) : (
            <>
              <div className={\`text-lg font-bold \${isOk ? 'text-green-400' : 'text-red-400'}\`}>
                {isOk ? 'Online' : 'Offline'}
              </div>
              <p className="text-xs text-zinc-500 mt-1 truncate">
                {item?.message || (isOk ? 'Operacional' : 'Sem resposta')}
              </p>
              {item?.duration && (
                <p className="text-[10px] text-zinc-600 mt-1 font-mono">
                  Latência: {item.duration}ms
                </p>
              )}
            </>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Monitor do Sistema</h1>
          <p className="text-zinc-400 text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Status em tempo real
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Atualizado: {lastUpdate.toLocaleTimeString()}
          </span>
          <button 
            onClick={fetchStatus}
            disabled={loading}
            className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition disabled:opacity-50"
          >
            <RefreshCw className={\`w-4 h-4 text-white \${loading ? 'animate-spin' : ''}\`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard id="database" label="Banco de Dados" icon={Database} />
        <StatusCard id="youtube" label="YouTube API" icon={Globe} />
        <StatusCard id="gemini" label="Gemini AI" icon={Server} />
        <StatusCard id="elevenlabs" label="ElevenLabs" icon={Activity} />
      </div>

      <h2 className="text-lg font-semibold text-white mt-8 mb-4">APIs Auxiliares</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard id="openai" label="OpenAI" icon={Globe} />
        <StatusCard id="pexels" label="Pexels" icon={Globe} />
        <StatusCard id="stability" label="Stability AI" icon={Globe} />
        <StatusCard id="json2video" label="JSON2Video" icon={Globe} />
        <StatusCard id="pixabay" label="Pixabay" icon={Globe} />
      </div>
    </div>
  )
}
