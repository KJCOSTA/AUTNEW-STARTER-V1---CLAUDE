import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Server, Database, Wifi, Shield, AlertTriangle, CheckCircle2, XCircle, RefreshCw, ChevronRight } from 'lucide-react'

export function SystemCheck({ onComplete }: { onComplete: () => void }) {
  const [logs, setLogs] = useState<string[]>([])
  const [status, setStatus] = useState<'running' | 'success' | 'error'>('running')
  const [results, setResults] = useState<any[]>([])

  const addLog = (msg: string) => setLogs(prev => [...prev, \`[\${new Date().toLocaleTimeString()}] \${msg}\`])

  const runDiagnostics = async () => {
    setStatus('running')
    setResults([])
    setLogs([]) // Limpar logs anteriores
    addLog('Iniciando diagnóstico completo...')

    try {
      // 1. Server
      addLog('Verificando servidor...')
      const srv = await fetch('/api/system-check?check=server').then(r => r.json())
      setResults(prev => [...prev, { name: 'Servidor', status: srv.server?.online ? 'success' : 'error', details: srv.server?.environment }])

      // 2. Database
      addLog('Verificando Banco de Dados...')
      const db = await fetch('/api/system-check?check=database').then(r => r.json())
      const dbStatus = db.database?.connected ? 'success' : 'error'
      const dbMsg = db.database?.error ? \`Erro: \${db.database.error}\` : \`Tabelas: \${db.database?.tables?.length || 0}\`
      setResults(prev => [...prev, { name: 'Banco de Dados', status: dbStatus, details: dbMsg }])

      // 3. APIs Deep Check
      addLog('Testando APIs (Deep Scan)...')
      const apiRes = await fetch('/api/system-check?check=apis&deep=true').then(r => r.json())
      const apis = apiRes.apis || {}

      Object.entries(apis).forEach(([key, val]: [string, any]) => {
        let st = 'warning';
        if (val.connected) st = 'success';
        if (val.error) st = 'error';
        if (!val.configured) st = 'pending';

        setResults(prev => [...prev, { 
          name: val.name || key.toUpperCase(), 
          status: st, 
          details: val.error ? \`ERRO: \${val.error} \${val.details || ''}\` : (val.details || 'Conectado')
        }])
      })

      addLog('Diagnóstico finalizado.')
      setStatus('success') // Permite continuar mesmo com erros, o usuário decide

    } catch (e: any) {
      addLog(\`ERRO FATAL: \${e.message}\`)
      setStatus('error')
    }
  }

  useEffect(() => { runDiagnostics() }, [])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-mono">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Shield className="w-6 h-6 text-purple-500" />
             <h1 className="text-xl font-bold">SYSTEM BOOT CHECK</h1>
          </div>
          {status === 'running' && <RefreshCw className="w-5 h-5 animate-spin text-zinc-500" />}
        </div>

        {/* Results List */}
        <div className="p-6 space-y-4 bg-black/50 min-h-[300px] max-h-[500px] overflow-y-auto">
          {results.map((r, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3 p-3 rounded bg-zinc-800/50 border border-zinc-700/50"
            >
              <div className="mt-1">
                {r.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                {r.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                {r.status === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                {r.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-zinc-600" />}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-bold text-sm text-zinc-200">{r.name}</div>
                <div className="text-xs text-zinc-400 break-words mt-1 font-mono">{r.details}</div>
              </div>
            </motion.div>
          ))}
          
          {results.length === 0 && <div className="text-zinc-500 text-center py-10">Inicializando sondas...</div>}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-zinc-800 flex gap-4 bg-zinc-900">
           <button 
             onClick={runDiagnostics} 
             disabled={status === 'running'}
             className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm transition disabled:opacity-50"
           >
             Rodar Novamente
           </button>
           
           <button 
             onClick={onComplete}
             className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-bold flex items-center justify-center gap-2"
           >
             Entrar no Sistema <ChevronRight className="w-4 h-4" />
           </button>
        </div>
      </div>
      
      {/* Mini Log Console */}
      <div className="w-full max-w-2xl mt-4 p-2">
        <div className="text-xs text-zinc-600 mb-1">LIVE LOGS:</div>
        <div className="h-24 overflow-y-auto text-[10px] text-zinc-500 font-mono bg-black p-2 rounded border border-zinc-900">
          {logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>
    </div>
  )
}
