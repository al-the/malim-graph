'use client'

import { useEffect, useState, useCallback, Fragment } from 'react'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Drawer } from '@/components/ui/Drawer'
import { SubmissionDetail } from './SubmissionDetail'
import Link from 'next/link'
import type { Submission, SubmissionStatus } from '@/lib/types'

const STATUS_TABS = ['all', 'pending', 'approved', 'rejected', 'flagged', 'draft'] as const
type StatusTab = (typeof STATUS_TABS)[number]

const STATUS_LABELS: Record<StatusTab, string> = {
  all: 'All',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  flagged: 'Flagged',
  draft: 'Draft',
}

export function SubmissionsTable({ role }: { role: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<StatusTab>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Submission | null>(null)
  const [expandedReject, setExpandedReject] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const q = new URLSearchParams({ page: String(page) })
    if (status !== 'all') q.set('status', status)
    if (search) q.set('search', search)
    const res = await fetch(`/api/submissions?${q}`)
    const data = await res.json()
    setSubmissions(data.submissions || [])
    setLoading(false)
  }, [page, status, search])

  useEffect(() => { load() }, [load])

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Filter bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setStatus(tab); setPage(1) }}
              className={`px-3 h-8 text-2xs font-medium border-b-2 transition-colors duration-150 ${
                status === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {STATUS_LABELS[tab]}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Search by title…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="h-8 px-3 rounded border border-border bg-bg-subtle text-xs text-text-primary placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 w-64"
        />
      </div>

      {/* Table */}
      <div className="bg-bg-surface border border-border rounded-lg shadow-card overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Source</th>
                <th>Doc Type</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTable rows={8} cols={6} />
              ) : submissions.length === 0 ? (
                <EmptyState message="No submissions found" description="Try adjusting your filters." />
              ) : (
                submissions.map((s) => (
                  <Fragment key={s.id}>
                    <tr className="cursor-pointer" onClick={() => setSelected(s)}>
                      <td>
                        <span className="block max-w-[200px] truncate" title={s.s1_title_en}>
                          {s.s1_title_en}
                        </span>
                      </td>
                      <td className="text-text-secondary">{s.s1_source_authority}</td>
                      <td className="text-text-secondary">{s.s1_doc_type}</td>
                      <td className="mono text-text-secondary">{s.submitted_at?.slice(0, 10)}</td>
                      <td><Badge variant={s.status as SubmissionStatus} /></td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {s.status === 'pending' && role === 'porter' ? (
                            <Link href={`/submissions/${s.id}`} className="text-2xs text-accent hover:underline">Edit</Link>
                          ) : (
                            <button onClick={() => setSelected(s)} className="text-2xs text-accent hover:underline">View</button>
                          )}
                          {s.status === 'rejected' && (
                            <button
                              onClick={() => setExpandedReject(expandedReject === s.id ? null : s.id)}
                              className="text-2xs text-danger hover:underline"
                            >
                              {expandedReject === s.id ? 'Hide reason' : 'View reason'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedReject === s.id && s.status === 'rejected' && (
                      <tr>
                        <td colSpan={6} className="bg-red-50 px-4 py-3">
                          <p className="text-2xs font-medium text-danger mb-1">Rejection reason:</p>
                          <p className="text-xs text-text-primary">{s.review_note || '(No reason provided)'}</p>
                        </td>
                      </tr>
                    )}
                    {s.status === 'flagged' && expandedReject === s.id && (
                      <tr>
                        <td colSpan={6} className="bg-purple-50 px-4 py-3">
                          <p className="text-2xs font-medium text-pending mb-1">Flag note:</p>
                          <p className="text-xs text-text-primary">{s.review_note || '(No note provided)'}</p>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <p className="text-2xs text-text-secondary">Page {page}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-7 px-3 text-2xs border border-border rounded text-text-secondary hover:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={submissions.length < 20}
              className="h-7 px-3 text-2xs border border-border rounded text-text-secondary hover:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Detail drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.s1_title_en || 'Submission'}>
        {selected && <SubmissionDetail submission={selected} />}
      </Drawer>
    </div>
  )
}
