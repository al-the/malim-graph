'use client'

import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  helper?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, helper, error, options, placeholder, className = '', id, ...props },
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
      <select
        ref={ref}
        id={inputId}
        className={`h-9 px-3 rounded border bg-bg-subtle text-text-primary text-xs
          border-border focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:border-accent
          transition-colors duration-150 w-full cursor-pointer
          ${error ? 'border-danger focus:ring-danger' : ''}
          ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {helper && !error && <p className="text-2xs text-text-secondary">{helper}</p>}
      {error && <p className="text-2xs text-danger">{error}</p>}
    </div>
  )
})
