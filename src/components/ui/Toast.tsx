import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { useStore } from '../../store/useStore'
import type { Toast as ToastType } from '../../types'

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

const colors = {
  success: 'border-status-success bg-status-success/10',
  error: 'border-status-error bg-status-error/10',
  warning: 'border-status-warning bg-status-warning/10',
  info: 'border-accent-blue bg-accent-blue/10',
}

const iconColors = {
  success: 'text-status-success',
  error: 'text-status-error',
  warning: 'text-status-warning',
  info: 'text-accent-blue',
}

function ToastItem({ toast }: { toast: ToastType }) {
  const { removeToast } = useStore()
  const Icon = icons[toast.type]

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-sm ${colors[toast.type]}`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${iconColors[toast.type]}`} />
      <p className="text-sm text-text-primary flex-1">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="p-1 hover:bg-white/10 rounded-lg transition-colors"
      >
        <X className="w-4 h-4 text-text-secondary" />
      </button>
    </motion.div>
  )
}

export function ToastContainer() {
  const { toasts } = useStore()

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  )
}
