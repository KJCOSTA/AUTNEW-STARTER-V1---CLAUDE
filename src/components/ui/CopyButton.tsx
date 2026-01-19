import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check } from 'lucide-react'
import { useStore } from '../../store/useStore'

interface CopyButtonProps {
  text: string
  label?: string
  className?: string
}

export function CopyButton({ text, label, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const { addToast } = useStore()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      addToast({
        type: 'success',
        message: label ? `${label} copiado!` : 'Copiado para a área de transferência!',
        duration: 2000,
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      addToast({
        type: 'error',
        message: 'Erro ao copiar. Tente novamente.',
      })
    }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleCopy}
      className={`p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors ${className}`}
      title={copied ? 'Copiado!' : 'Copiar'}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Check className="w-4 h-4 text-status-success" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Copy className="w-4 h-4 text-text-secondary" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
