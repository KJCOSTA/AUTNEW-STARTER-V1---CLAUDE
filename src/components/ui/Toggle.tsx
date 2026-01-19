import { motion } from 'framer-motion'
import clsx from 'clsx'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: ToggleProps) {
  return (
    <label
      className={clsx(
        'flex items-center gap-4 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={clsx(
          'relative w-12 h-6 rounded-full transition-colors duration-200',
          checked ? 'bg-gradient-accent' : 'bg-white/10'
        )}
      >
        <motion.div
          animate={{ x: checked ? 24 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg"
        />
      </button>
      {(label || description) && (
        <div>
          {label && (
            <span className="block text-sm font-medium text-text-primary">
              {label}
            </span>
          )}
          {description && (
            <span className="block text-xs text-text-secondary">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  )
}
