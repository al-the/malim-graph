'use client'

interface StarRatingProps {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  minLabel?: string
  maxLabel?: string
}

export function StarRating({ value, onChange, max = 5, minLabel, maxLabel }: StarRatingProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {Array.from({ length: max }).map((_, i) => {
          const star = i + 1
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className={`text-xl transition-colors duration-150 focus-ring rounded ${
                star <= value ? 'text-amber-400' : 'text-border hover:text-amber-300'
              }`}
              aria-label={`Rate ${star}`}
            >
              ★
            </button>
          )
        })}
        <span className="ml-2 text-2xs text-text-secondary">{value > 0 ? `${value} / ${max}` : 'Not rated'}</span>
      </div>
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-2xs text-text-disabled">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  )
}
