'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'purple'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover border-transparent',
  secondary: 'bg-transparent text-primary border-primary hover:bg-blue-50',
  ghost: 'bg-transparent text-text-secondary border-transparent hover:bg-bg-subtle hover:text-text-primary',
  danger: 'bg-transparent text-danger border-danger hover:bg-red-50',
  success: 'bg-transparent text-success border-success hover:bg-green-50',
  purple: 'bg-transparent text-pending border-pending hover:bg-purple-50',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className = '', children, ...props },
  ref,
) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded border transition-colors duration-150 focus-ring cursor-pointer select-none whitespace-nowrap'
  const sizeClass = size === 'sm' ? 'h-7 px-2 text-xs' : 'h-8 px-2 text-xs'
  const disabledClass = disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${base} ${sizeClass} ${variantClasses[variant]} ${disabledClass} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
})
