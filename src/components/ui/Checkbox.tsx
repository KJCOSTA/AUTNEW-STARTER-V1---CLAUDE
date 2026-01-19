import { forwardRef, InputHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { Check } from 'lucide-react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, checked, onChange, id, ...props }, ref) => {
    const checkboxId = id || label.toLowerCase().replace(/\s/g, '-')

    return (
      <label
        htmlFor={checkboxId}
        className={clsx(
          'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200',
          checked
            ? 'bg-accent-blue/10 border border-accent-blue/30'
            : 'bg-background/50 border border-white/10 hover:border-white/20',
          className
        )}
      >
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
          {...props}
        />
        <motion.div
          initial={false}
          animate={{
            backgroundColor: checked ? '#3b82f6' : 'transparent',
            borderColor: checked ? '#3b82f6' : 'rgba(255,255,255,0.2)',
          }}
          className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
        >
          {checked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Check className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </motion.div>
        <span className="text-sm text-text-primary">{label}</span>
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'
