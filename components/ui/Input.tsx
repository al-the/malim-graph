'use client'

import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helper?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helper, error, className = '', id, ...props },
  ref,
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-2xs font-medium text-text-primary">
          {label}
          {props.required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`h-9 px-3 rounded border bg-bg-subtle text-text-primary text-xs placeholder-text-disabled
          border-border focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:border-accent
          transition-colors duration-150 w-full
          ${error ? 'border-danger focus:ring-danger' : ''}
          ${className}`}
        {...props}
      />
      {helper && !error && <p className="text-2xs text-text-secondary">{helper}</p>}
      {error && <p className="text-2xs text-danger">{error}</p>}
    </div>
  )
})
