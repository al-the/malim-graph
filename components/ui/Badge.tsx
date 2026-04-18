import { ReactNode } from 'react'

type BadgeVariant =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'flagged'
  | 'draft'
  | 'admin'
  | 'supervisor'
  | 'porter'
  | 'minor'
  | 'moderate'
  | 'major'
  | 'active'
  | 'suspended'
  | 'default'

const variantStyles: Record<BadgeVariant, string> = {
  pending: 'text-amber-700 bg-amber-50 border-amber-200',
  approved: 'text-green-700 bg-green-50 border-green-200',
  rejected: 'text-red-700 bg-red-50 border-red-200',
  flagged: 'text-purple-700 bg-purple-50 border-purple-200',
  draft: 'text-gray-600 bg-gray-100 border-gray-200',
  admin: 'text-[#1B3A6B] bg-blue-50 border-blue-200',
  supervisor: 'text-[#2E7D9B] bg-cyan-50 border-cyan-200',
  porter: 'text-gray-600 bg-gray-100 border-gray-200',
  minor: 'text-[#2E7D9B] bg-cyan-50 border-cyan-200',
  moderate: 'text-amber-700 bg-amber-50 border-amber-200',
  major: 'text-red-700 bg-red-50 border-red-200',
  active: 'text-green-700 bg-green-50 border-green-200',
  suspended: 'text-red-700 bg-red-50 border-red-200',
  default: 'text-gray-600 bg-gray-100 border-gray-200',
}

const labels: Partial<Record<BadgeVariant, string>> = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  flagged: 'Flagged',
  draft: 'Draft',
  admin: 'Admin',
  supervisor: 'Supervisor',
  porter: 'Porter',
  minor: 'Minor',
  moderate: 'Moderate',
  major: 'Major',
  active: 'Active',
  suspended: 'Suspended',
}

interface BadgeProps {
  variant: BadgeVariant
  children?: ReactNode
  className?: string
}

export function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-2xs font-medium rounded border ${variantStyles[variant]} ${className}`}
    >
      {children ?? labels[variant] ?? variant}
    </span>
  )
}
