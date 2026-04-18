'use client'

import { useEffect, useState } from 'react'
import { StatCard } from '@/components/ui/StatCard'
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { Submission } from '@/lib/types'

interface PorterRow {
  porter_id: string
  porter_name: string
  approved: number
  pending: number
  total: number
}

interface PendingUser {
  id: string
  name: string
  email: string
  role: string
  porter_id: string | null
  created_at: string
}

interface DashboardData {
  total_submissions: number
  pending_review: number
  approved_today: number
  rejected: number
  active_porters: number
  unresolved_conflicts?: number
  pending_registrations?: PendingUser[]
  pending_queue: Submission[]
  leaderboard: PorterRow[]
}

export function SupervisorDashboard({ role }: { role: string }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState<string | null>(null)

  function load() {
    setLoading(true)
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleApproval(userId: string, approve: boolean) {
    setActioning(userId)
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: approve ? 'active' : 'suspended' }),
      })
      if (!res.ok) throw new Error()
      toast.success(approve ? 'Account approved.' : 'Account rejected.')
      load()
    } catch {
      toast.error('Action failed. Please try again.')
    } finally {
      setActioning(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }
  if (!data) return <p className="text-text-secondary">Failed to load dashboard.</p>

  const pendingRegs = data.pending_registrations || []

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Submissions" value={data.total_submissions} />
        <StatCard label="Pending Review" value={data.pending_review} accent />
        <StatCard label="Approved Today" value={data.approved_today} />
        <StatCard label="Rejected" value={data.rejected} />
        <StatCard label="Active Porters" value={data.active_porters} />
      </div>

      {role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.unresolved_conflicts !== undefined && (
            <StatCard label="Unresolved Conflicts" value={data.unresolved_conflicts} />
          )}
          <StatCard
            label="Pending Registrations"
            value={pendingRegs.length}
            accent={pendingRegs.length > 0}
            sub={pendingRegs.length > 0 ? 'Awaiting your approval' : undefined}
          />
        </div>
      )}

      {/* Pending registrations panel — admin only */}
      {role === 'admin' && pendingRegs.length > 0 && (
        <div className="bg-bg-surface border border-amber-200 rounded-lg shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-200 bg-amber-50 flex items-center gap-3">
            <svg className="w-4 h-4 text-warning flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-warning">Pending Account Approvals</h2>
            <Badge variant="pending" className="ml-1">{pendingRegs.length}</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Requested Role</th>
                  <th>Porter ID</th>
                  <th>Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRegs.map((u) => (
                  <tr key={u.id}>
                    <td className="font-medium">{u.name}</td>
                    <td className="text-text-secondary">{u.email}</td>
                    <td><Badge variant={u.role as 'porter' | 'supervisor' | 'admin'} /></td>
                    <td className="mono text-text-secondary">{u.porter_id || '—'}</td>
                    <td className="mono text-text-secondary">{u.created_at?.slice(0, 10)}</td>
                    <td>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          loading={actioning === u.id}
                          onClick={() => handleApproval(u.id, true)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          loading={actioning === u.id}
                          onClick={() => handleApproval(u.id, false)}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending review queue */}
      <div className="bg-bg-surface border border-border rounded-lg shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Pending Review Queue</h2>
          <Link href="/review" className="text-2xs text-accent hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Porter</th>
                <th>Source</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.pending_queue.length === 0 ? (
                <EmptyState message="Queue is clear" description="No submissions awaiting review." />
              ) : (
                data.pending_queue.map((s) => (
                  <tr key={s.id}>
                    <td className="max-w-[220px] truncate" title={s.s1_title_en}>{s.s1_title_en}</td>
                    <td className="text-text-secondary">{s.porter_name}</td>
                    <td className="text-text-secondary">{s.s1_source_authority}</td>
                    <td className="mono text-text-secondary">{s.submitted_at.slice(0, 10)}</td>
                    <td>
                      <Link href="/review" className="text-2xs text-accent hover:underline">Review</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Porter leaderboard */}
      <div className="bg-bg-surface border border-border rounded-lg shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">Porter Leaderboard</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Porter</th>
                <th>Approved</th>
                <th>Pending</th>
                <th>Tier</th>
              </tr>
            </thead>
            <tbody>
              {data.leaderboard.length === 0 ? (
                <EmptyState message="No porter data" description="No submissions recorded yet." />
              ) : (
                data.leaderboard.map((p) => (
                  <tr key={p.porter_id}>
                    <td className="font-medium">{p.porter_name}</td>
                    <td className="text-success font-semibold">{p.approved}</td>
                    <td className="text-text-secondary">{p.pending}</td>
                    <td>
                      {p.approved >= 100 ? (
                        <Badge variant="approved">Distinguished</Badge>
                      ) : p.approved >= 10 ? (
                        <Badge variant="minor">Contributor</Badge>
                      ) : (
                        <Badge variant="draft">—</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
