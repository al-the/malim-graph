'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Badge } from '@/components/ui/Badge'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface SidebarProps {
  role: string
  name: string
}

function NavLink({ href, label, icon }: NavItem) {
  const pathname = usePathname()
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 h-9 rounded text-xs transition-colors duration-150 focus-ring ${
        active
          ? 'bg-primary text-white font-medium'
          : 'text-text-secondary hover:bg-bg-subtle hover:text-text-primary'
      }`}
    >
      <span className="w-4 h-4 flex-shrink-0">{icon}</span>
      {label}
    </Link>
  )
}

const icons = {
  dashboard: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    </svg>
  ),
  submissions: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  new: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4v16m8-8H4" />
    </svg>
  ),
  review: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  conflicts: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  registry: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
    </svg>
  ),
  users: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  audit: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
}

export function Sidebar({ role, name }: SidebarProps) {
  const isPorter = role === 'porter'
  const isSupervisor = role === 'supervisor'
  const isAdmin = role === 'admin'
  const isSuperOrAdmin = isSupervisor || isAdmin

  return (
    <aside className="w-[220px] flex-shrink-0 bg-bg-surface border-r border-border flex flex-col h-screen sticky top-0 overflow-y-auto">
      {/* Wordmark */}
      <div className="px-4 py-4 border-b border-border">
        <div className="text-primary font-semibold text-lg leading-tight">Malim</div>
        <div className="text-2xs text-text-secondary leading-tight">Knowledge Graph Portal</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 flex flex-col gap-0.5">
        <p className="text-2xs font-medium text-text-disabled uppercase tracking-wider px-3 py-2">Main</p>
        <NavLink href="/dashboard" label="Dashboard" icon={icons.dashboard} />
        <NavLink href="/submissions" label={isPorter ? 'My Submissions' : 'All Submissions'} icon={icons.submissions} />
        {isPorter && <NavLink href="/submissions/new" label="Submit Document" icon={icons.new} />}

        {isSuperOrAdmin && (
          <>
            <p className="text-2xs font-medium text-text-disabled uppercase tracking-wider px-3 py-2 mt-2">Review</p>
            <NavLink href="/review" label="Review Queue" icon={icons.review} />
            {isAdmin && <NavLink href="/conflicts" label="Conflict Queue" icon={icons.conflicts} />}
          </>
        )}

        {isAdmin && (
          <>
            <p className="text-2xs font-medium text-text-disabled uppercase tracking-wider px-3 py-2 mt-2">Registry</p>
            <NavLink href="/registry" label="Indicator Registry" icon={icons.registry} />

            <p className="text-2xs font-medium text-text-disabled uppercase tracking-wider px-3 py-2 mt-2">Admin</p>
            <NavLink href="/admin/users" label="User Management" icon={icons.users} />
            <NavLink href="/admin/audit" label="Audit Log" icon={icons.audit} />
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-border p-3 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-2xs font-semibold flex-shrink-0">
          {name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-primary truncate">{name}</p>
          <Badge variant={role as 'admin' | 'supervisor' | 'porter'} className="mt-0.5" />
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-text-disabled hover:text-danger transition-colors focus-ring rounded p-1"
          title="Sign out"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
