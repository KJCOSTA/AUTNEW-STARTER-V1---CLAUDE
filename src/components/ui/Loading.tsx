import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface LoadingProps {
  message?: string
  fullScreen?: boolean
}

export function Loading({ message, fullScreen = false }: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="relative"
      >
        <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-accent-blue" />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Sparkles className="w-6 h-6 text-accent-blue" />
        </motion.div>
      </motion.div>
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-text-secondary text-center max-w-xs"
        >
          {message}
        </motion.p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
      >
        {content}
      </motion.div>
    )
  }

  return content
}

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10"
    >
      <Loading message={message} />
    </motion.div>
  )
}

export function LoadingDots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          className="w-1.5 h-1.5 rounded-full bg-accent-blue"
        />
      ))}
    </span>
  )
}
