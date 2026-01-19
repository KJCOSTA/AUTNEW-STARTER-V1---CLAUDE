import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'input-dark w-full px-4 py-2.5 rounded-xl text-sm',
            error && 'border-status-error focus:border-status-error',
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-text-secondary">{hint}</p>
        )}
        {error && <p className="text-xs text-status-error">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={clsx(
            'input-dark w-full px-4 py-3 rounded-xl text-sm resize-none',
            error && 'border-status-error focus:border-status-error',
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-text-secondary">{hint}</p>
        )}
        {error && <p className="text-xs text-status-error">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
