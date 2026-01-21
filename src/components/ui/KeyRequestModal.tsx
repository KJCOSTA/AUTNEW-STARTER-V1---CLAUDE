import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Key, Lock, ArrowRight, AlertTriangle } from 'lucide-react'

interface KeyRequestModalProps {
  isOpen: boolean
  missingKeys: string[]
  onSubmit: (keys: Record<string, string>) => void
  onCancel: () => void
}

export function KeyRequestModal({ isOpen, missingKeys, onSubmit, onCancel }: KeyRequestModalProps) {
  const [values, setValues] = useState<Record<string, string>>({})

  if (!isOpen) return null

  const handleSubmit = () => {
    onSubmit(values)
  }

  const mapName = (k: string) => {
    if (k === 'openai') return 'OpenAI API Key'
    if (k === 'youtube') return 'YouTube API Key'
    if (k === 'channel') return 'YouTube Channel ID'
    return k
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-500/10 rounded-full">
              <Key className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Chave Necessária</h3>
              <p className="text-sm text-zinc-400">Para continuar, precisamos das seguintes chaves:</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {missingKeys.map(key => (
              <div key={key}>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                  {mapName(key)}
                </label>
                <input 
                  type="text" 
                  value={values[key] || ''}
                  onChange={e => setValues({...values, [key]: e.target.value})}
                  className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                  placeholder={`Cole sua ${key} aqui...`}
                />
              </div>
            ))}
            <div className="bg-zinc-800/50 p-3 rounded text-xs text-zinc-400 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              Isso é necessário porque a chave não foi encontrada nas configurações do servidor (Vercel).
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button 
              onClick={onCancel}
              className="px-4 py-2 text-zinc-400 hover:text-white transition"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit}
              disabled={Object.keys(values).length === 0}
              className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg flex items-center gap-2 transition disabled:opacity-50"
            >
              Salvar e Continuar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
