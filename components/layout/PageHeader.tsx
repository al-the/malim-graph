import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  breadcrumb?: string[]
  actions?: ReactNode
}

export function PageHeader({ title, breadcrumb, actions }: PageHeaderProps) {
  return (
    <div className="h-14 bg-bg-surface border-b border-border flex items-center px-6 gap-4 flex-shrink-0">
      <div className="flex-1 min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <p className="text-2xs text-text-disabled mb-0.5">
            {breadcrumb.map((crumb, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-1">/</span>}
                {crumb}
              </span>
            ))}
          </p>
        )}
        <h1 className="text-xl font-semibold text-text-primary truncate">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}
