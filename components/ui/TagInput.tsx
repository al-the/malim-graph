'use client'

interface TagInputProps {
  options: readonly string[]
  value: string[]
  onChange: (values: string[]) => void
  label?: string
  required?: boolean
  error?: string
  helper?: string
}

export function TagInput({ options, value, onChange, label, required, error, helper }: TagInputProps) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt))
    else onChange([...value, opt])
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-2xs font-medium text-text-primary">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-2.5 py-1 text-2xs rounded border transition-colors duration-150 focus-ring ${
              value.includes(opt)
                ? 'bg-primary text-white border-primary'
                : 'bg-bg-subtle text-text-secondary border-border hover:border-accent hover:text-accent'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {helper && <p className="text-2xs text-text-secondary">{helper}</p>}
      {error && <p className="text-2xs text-danger">{error}</p>}
    </div>
  )
}
