'use client'

import { TextareaHTMLAttributes, forwardRef } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helper?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, helper, error, className = '', id, rows = 3, ...props },
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
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={`px-3 py-2 rounded border bg-bg-subtle text-text-primary text-xs placeholder-text-disabled
          border-border focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:border-accent
          transition-colors duration-150 w-full resize-y
          ${error ? 'border-danger focus:ring-danger' : ''}
          ${className}`}
        {...props}
      />
      {helper && !error && <p className="text-2xs text-text-secondary">{helper}</p>}
      {error && <p className="text-2xs text-danger">{error}</p>}
    </div>
  )
})
