interface StepProgressProps {
  steps: string[]
  current: number
}

export function StepProgress({ steps, current }: StepProgressProps) {
  return (
    <div className="flex items-start w-full gap-0">
      {steps.map((label, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <div key={label} className="flex-1 flex flex-col items-center">
            <div className="flex items-center w-full">
              {i > 0 && (
                <div
                  className="flex-1 h-0.5 transition-colors duration-150"
                  style={{ background: done || active ? '#1B3A6B' : '#D8DCE6' }}
                />
              )}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-2xs font-semibold border-2 transition-colors duration-150 flex-shrink-0 ${
                  done
                    ? 'bg-primary border-primary text-white'
                    : active
                      ? 'bg-accent border-accent text-white'
                      : 'bg-bg-surface border-border text-text-disabled'
                }`}
              >
                {done ? '✓' : step}
              </div>
              {i < steps.length - 1 && (
                <div
                  className="flex-1 h-0.5 transition-colors duration-150"
                  style={{ background: done ? '#1B3A6B' : '#D8DCE6' }}
                />
              )}
            </div>
            <span
              className={`mt-1 text-2xs text-center ${active ? 'text-accent font-medium' : done ? 'text-text-secondary' : 'text-text-disabled'}`}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
