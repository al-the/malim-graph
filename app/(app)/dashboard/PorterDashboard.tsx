'use client'

import { useEffect, useState } from 'react'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'
import type { Submission, SubmissionStatus } from '@/lib/types'

interface ActiveTitle {
  id: string
  s1_title_en: string
  s1_source_authority: string
  status: string
  porter_id: string
}

interface DashboardData {
  total_submitted: number
  approved: number
  pending: number
  rejected: number
  recent: Submission[]
  all_active_titles: ActiveTitle[]
}

export function PorterDashboard({ userId }: { userId: string }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [titleSearch, setTitleSearch] = useState('')

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  if (!data) return <p className="text-text-secondary">Failed to load dashboard.</p>

  const contributorProgress = Math.min((data.approved / 10) * 100, 100)
  const distinguishedProgress = Math.min((data.approved / 100) * 100, 100)

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Submitted" value={data.total_submitted} />
        <StatCard label="Approved" value={data.approved} accent />
        <StatCard label="Pending Review" value={data.pending} />
        <StatCard label="Rejected" value={data.rejected} />
      </div>

      {/* Progress card */}
      <div className="bg-bg-surface border border-border rounded-lg p-5 shadow-card">
        <h2 className="text-lg font-semibold text-text-primary mb-1">Contributor Progress</h2>
        <p className="text-2xs text-text-secondary mb-4">Track your progress toward achievement tiers.</p>

        <div className="flex flex-col gap-3">
          <div>
            <div className="flex justify-between text-2xs mb-1">
              <span className="font-medium text-text-primary">Contributor</span>
              <span className="text-text-secondary">{data.approved} / 10 approved</span>
            </div>
            <div className="h-2 rounded bg-bg-subtle overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500"
                style={{ width: `${contributorProgress}%`, background: '#1B3A6B' }}
              />
            </div>
            {data.approved >= 10 && (
              <span className="mt-1 inline-flex text-2xs font-medium text-[#1B3A6B] bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
                Contributor Tier Achieved
              </span>
            )}
          </div>
          <div>
            <div className="flex justify-between text-2xs mb-1">
              <span className="font-medium text-text-primary">Distinguished</span>
              <span className="text-text-secondary">{data.approved} / 100 approved</span>
            </div>
            <div className="h-2 rounded bg-bg-subtle overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500"
                style={{ width: `${distinguishedProgress}%`, background: '#2E7D9B' }}
              />
            </div>
            {data.approved >= 100 && (
              <span className="mt-1 inline-flex text-2xs font-medium text-[#2E7D9B] bg-cyan-50 border border-cyan-200 rounded px-2 py-0.5">
                Distinguished Tier Achieved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* All pending & approved titles — duplicate prevention */}
      <div className="bg-bg-surface border border-border rounded-lg shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">All Pending &amp; Approved Titles</h2>
            <p className="text-2xs text-text-secondary mt-0.5">Check before submitting to avoid duplicates</p>
          </div>
          <input
            type="search"
            placeholder="Search titles…"
            value={titleSearch}
            onChange={(e) => setTitleSearch(e.target.value)}
            className="h-8 px-3 rounded border border-border bg-bg-subtle text-xs text-text-primary placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 w-56"
          />
        </div>
        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Source</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(data.all_active_titles || [])
                .filter((t) =>
                  !titleSearch || t.s1_title_en.toLowerCase().includes(titleSearch.toLowerCase())
                )
                .map((t) => (
                  <tr key={t.id}>
                    <td className="max-w-[280px] truncate" title={t.s1_title_en}>
                      {t.porter_id === userId ? (
                        <Link href={`/submissions/${t.id}`} className="text-accent hover:underline">
                          {t.s1_title_en}
                        </Link>
                      ) : t.s1_title_en}
                    </td>
                    <td className="text-text-secondary">{t.s1_source_authority}</td>
                    <td><Badge variant={t.status as SubmissionStatus} /></td>
                  </tr>
                ))}
              {(data.all_active_titles || []).filter((t) =>
                !titleSearch || t.s1_title_en.toLowerCase().includes(titleSearch.toLowerCase())
              ).length === 0 && (
                <EmptyState message="No active submissions found" />
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent submissions */}
      <div className="bg-bg-surface border border-border rounded-lg shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">My Recent Submissions</h2>
          <Link href="/submissions" className="text-2xs text-accent hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Source</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTable rows={5} cols={5} />
              ) : data.recent.length === 0 ? (
                <EmptyState message="No submissions yet" description="Submit your first document to get started." />
              ) : (
                data.recent.map((s) => (
                  <tr key={s.id}>
                    <td className="max-w-[220px] truncate" title={s.s1_title_en}>{s.s1_title_en}</td>
                    <td className="text-text-secondary">{s.s1_source_authority}</td>
                    <td className="text-text-secondary mono">{s.submitted_at.slice(0, 10)}</td>
                    <td><Badge variant={s.status as SubmissionStatus} /></td>
                    <td>
                      {s.status === 'pending' ? (
                        <Link href={`/submissions/${s.id}`} className="text-2xs text-accent hover:underline">Continue editing</Link>
                      ) : (
                        <Link href={`/submissions/${s.id}`} className="text-2xs text-accent hover:underline">View</Link>
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
