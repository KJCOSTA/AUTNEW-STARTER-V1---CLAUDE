import { motion } from 'framer-motion'
import { Inbox, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  title: string
  message: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  variant?: 'default' | 'error'
}

export function EmptyState({
  title,
  message,
  icon,
  action,
  variant = 'default',
}: EmptyStateProps) {
  const IconComponent = variant === 'error' ? AlertCircle : Inbox
  const iconColor = variant === 'error' ? 'text-status-error' : 'text-text-secondary'
  const bgColor = variant === 'error' ? 'bg-status-error/10' : 'bg-white/5'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-12 px-6 rounded-xl ${bgColor}`}
    >
      <div className={`w-16 h-16 rounded-full ${variant === 'error' ? 'bg-status-error/20' : 'bg-white/10'} flex items-center justify-center mb-4`}>
        {icon || <IconComponent className={`w-8 h-8 ${iconColor}`} />}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary text-center max-w-md mb-4">{message}</p>
      {action && (
        <Button
          onClick={action.onClick}
          variant={variant === 'error' ? 'secondary' : 'primary'}
          icon={variant === 'error' ? <RefreshCw className="w-4 h-4" /> : undefined}
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  )
}

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({ title = 'Erro', message, onRetry }: ErrorStateProps) {
  return (
    <EmptyState
      title={title}
      message={message}
      variant="error"
      action={onRetry ? { label: 'Tentar novamente', onClick: onRetry } : undefined}
    />
  )
}

interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = 'Carregando...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="w-12 h-12 rounded-full border-2 border-accent-blue/30 border-t-accent-blue animate-spin mb-4" />
      <p className="text-sm text-text-secondary">{message}</p>
    </div>
  )
}
