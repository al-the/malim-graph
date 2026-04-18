'use client'

import { useEffect, useState } from 'react'
import { StatCard } from '@/components/ui/StatCard'
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import type { Submission } from '@/lib/types'

interface PorterRow {
  porter_id: string
  porter_name: string
  approved: number
  pending: number
  total: number
}

interface DashboardData {
  total_submissions: number
  pending_review: number
  approved_today: number
  rejected: number
  active_porters: number
  unresolved_conflicts?: number
  pending_queue: Submission[]
  leaderboard: PorterRow[]
}

function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / 86400000)
}

export function SupervisorDashboard({ role }: { role: string }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

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

      {role === 'admin' && data.unresolved_conflicts !== undefined && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Unresolved Conflicts" value={data.unresolved_conflicts} />
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
              {loading ? (
                <SkeletonTable rows={4} cols={4} />
              ) : data.leaderboard.length === 0 ? (
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
