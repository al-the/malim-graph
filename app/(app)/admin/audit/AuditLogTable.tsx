'use client'

import { useEffect, useState, useCallback } from 'react'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import type { AuditLog } from '@/lib/types'

export function AuditLogTable() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filters, setFilters] = useState({ action: '', user: '', from: '', to: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const q = new URLSearchParams({ page: String(page) })
    if (filters.action) q.set('action', filters.action)
    if (filters.user) q.set('user', filters.user)
    if (filters.from) q.set('from', filters.from)
    if (filters.to) q.set('to', filters.to)
    const res = await fetch(`/api/audit?${q}`)
    const data = await res.json()
    setLogs(data.logs || [])
    setLoading(false)
  }, [page, filters])

  useEffect(() => { load() }, [load])

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input placeholder="Filter by action…" value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          className="h-8 px-3 rounded border border-border bg-bg-subtle text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 w-44" />
        <input placeholder="Filter by user…" value={filters.user} onChange={(e) => setFilters({ ...filters, user: e.target.value })}
          className="h-8 px-3 rounded border border-border bg-bg-subtle text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 w-44" />
        <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          className="h-8 px-3 rounded border border-border bg-bg-subtle text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" />
        <span className="text-text-disabled text-2xs">to</span>
        <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          className="h-8 px-3 rounded border border-border bg-bg-subtle text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" />
      </div>

      <div className="bg-bg-surface border border-border rounded-lg shadow-card overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Performed By</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTable rows={8} cols={5} />
              ) : logs.length === 0 ? (
                <EmptyState message="No audit logs found" description="Actions will be recorded here." />
              ) : (
                logs.map((log) => (
                  <>
                    <tr key={log.id} className="cursor-pointer" onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                      <td className="mono text-text-secondary text-2xs">{log.timestamp?.slice(0, 19).replace('T', ' ')}</td>
                      <td><code className="mono text-xs bg-bg-subtle px-1.5 py-0.5 rounded">{log.action}</code></td>
                      <td className="text-text-secondary">{log.performed_by_name}</td>
                      <td className="mono text-text-disabled text-2xs">{log.target_type}:{log.target_id?.slice(0, 8)}…</td>
                      <td>
                        <button className="text-2xs text-accent hover:underline">
                          {expanded === log.id ? 'Collapse' : 'Expand'}
                        </button>
                      </td>
                    </tr>
                    {expanded === log.id && (
                      <tr key={`${log.id}-exp`}>
                        <td colSpan={5} className="bg-bg-subtle p-3">
                          <pre className="mono text-2xs text-text-primary whitespace-pre-wrap break-all">
                            {JSON.stringify(log.diff, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <p className="text-2xs text-text-secondary">Page {page}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="h-7 px-3 text-2xs border border-border rounded text-text-secondary hover:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed">
              Previous
            </button>
            <button onClick={() => setPage((p) => p + 1)} disabled={logs.length < 50}
              className="h-7 px-3 text-2xs border border-border rounded text-text-secondary hover:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
