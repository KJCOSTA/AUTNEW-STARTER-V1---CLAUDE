import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wand2, Youtube, Play, Loader2, AlertCircle } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Card } from '../ui/Card'
import { KeyRequestModal } from '../ui/KeyRequestModal'
import ReactMarkdown from 'react-markdown'

export function PlanRun() {
  const [topic, setTopic] = useState('')
  const [result, setResult] = useState<any>(null)
  const [missingKeys, setMissingKeys] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  
  const { loading, setLoading, tempKeys, setTempKey } = useStore()

  const handleRun = async (overrideKeys?: any) => {
    if (!topic && !overrideKeys) return
    
    setLoading(true)
    setMissingKeys([])
    setResult(null)

    try {
      // Combina chaves salvas na store com chaves novas (se houver)
      const smartKeys = { ...tempKeys, ...overrideKeys }

      const res = await fetch('/api/plan-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic, 
          smartKeys // Envia chaves manuais se existirem
        })
      })

      const data = await res.json()

      // CASO SMART: Faltam chaves
      if (res.status === 400 && data.error === 'MISSING_KEYS') {
        setMissingKeys(data.missing)
        setShowModal(true)
        setLoading(false)
        return
      }

      if (!res.ok) throw new Error(data.error || 'Erro ao gerar plano')

      setResult(data)
    } catch (e: any) {
      console.error(e)
      setResult({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  const handleKeysProvided = (keys: Record<string, string>) => {
    // Salva na store para não pedir de novo
    Object.entries(keys).forEach(([k, v]) => setTempKey(k, v))
    setShowModal(false)
    // Tenta de novo imediatamente
    handleRun(keys)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <KeyRequestModal 
        isOpen={showModal}
        missingKeys={missingKeys}
        onSubmit={handleKeysProvided}
        onCancel={() => setShowModal(false)}
      />

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/20">
          <Wand2 className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Planejamento AI</h1>
          <p className="text-zinc-400">Gere estratégias completas a partir de um tópico</p>
        </div>
      </div>

      <Card className="p-6 border-zinc-800 bg-black/40">
        <div className="flex gap-4">
          <input 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Sobre o que você quer criar hoje? (Ex: Dicas de Investimento)"
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
            onKeyDown={(e) => e.key === 'Enter' && handleRun()}
          />
          <button 
            onClick={() => handleRun()}
            disabled={loading || !topic}
            className="px-8 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Play fill="currentColor" />}
            Gerar
          </button>
        </div>
      </Card>

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {result.error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
              <AlertCircle /> {result.error}
            </div>
          ) : (
            <>
              {result.channel && (
                <div className="flex items-center gap-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                  <div className="p-2 bg-red-600 rounded-lg"><Youtube className="text-white" /></div>
                  <div>
                    <h3 className="font-bold">{result.channel.snippet.title}</h3>
                    <p className="text-xs text-zinc-500">Inscritos: {result.channel.statistics.subscriberCount}</p>
                  </div>
                </div>
              )}

              <Card className="p-8 border-zinc-800 bg-zinc-900/50 prose prose-invert max-w-none">
                 <ReactMarkdown>{result.plan}</ReactMarkdown>
              </Card>
            </>
          )}
        </motion.div>
      )}
    </div>
  )
}
