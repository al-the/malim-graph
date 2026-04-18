'use client'

import { useEffect, useState, useCallback } from 'react'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import toast from 'react-hot-toast'
import type { Submission } from '@/lib/types'

export function ConflictQueue() {
  const [conflicts, setConflicts] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState<Submission | null>(null)
  const [strategy, setStrategy] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/conflicts')
    const data = await res.json()
    setConflicts(data.conflicts || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleResolve() {
    if (!resolving || !strategy || !note) {
      toast.error('Strategy and note are required.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/conflicts/${resolving.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy, note }),
      })
      if (!res.ok) throw new Error()
      toast.success('Conflict resolved.')
      setResolving(null)
      load()
    } catch {
      toast.error('Failed to resolve conflict.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="bg-bg-surface border border-border rounded-lg shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">Unresolved Data Conflicts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Document Title</th>
                <th>Porter</th>
                <th>Conflict Source</th>
                <th>Conflict Value</th>
                <th>Severity</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTable rows={5} cols={7} />
              ) : conflicts.length === 0 ? (
                <EmptyState message="No unresolved conflicts" description="All flagged data conflicts have been resolved." />
              ) : (
                conflicts.map((c) => (
                  <tr key={c.id}>
                    <td className="max-w-[160px] truncate" title={c.s1_title_en}>{c.s1_title_en}</td>
                    <td className="text-text-secondary">{c.porter_name}</td>
                    <td className="text-text-secondary">{c.s4_conflict_source}</td>
                    <td className="text-text-secondary">{c.s4_conflict_value}</td>
                    <td>
                      {c.s4_conflict_severity && (
                        <Badge variant={c.s4_conflict_severity as 'minor' | 'moderate' | 'major'} />
                      )}
                    </td>
                    <td className="mono text-text-secondary">{c.submitted_at?.slice(0, 10)}</td>
                    <td>
                      <Button size="sm" onClick={() => { setResolving(c); setStrategy(''); setNote('') }}>
                        Resolve
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!resolving} onClose={() => setResolving(null)} title="Resolve Conflict" width={520}>
        <div className="p-6 flex flex-col gap-4">
          {resolving && (
            <div className="bg-bg-subtle rounded p-4 flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-secondary">Document</span>
                <span className="font-medium text-text-primary max-w-[200px] text-right">{resolving.s1_title_en}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Conflicting source</span>
                <span className="text-text-primary">{resolving.s4_conflict_source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Conflicting value</span>
                <span className="text-text-primary">{resolving.s4_conflict_value}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Reason given</span>
                <span className="text-text-primary">{resolving.s4_conflict_reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Severity</span>
                {resolving.s4_conflict_severity && (
                  <Badge variant={resolving.s4_conflict_severity as 'minor' | 'moderate' | 'major'} />
                )}
              </div>
            </div>
          )}

          <Select
            label="Resolution strategy"
            required
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            placeholder="Select strategy…"
            options={[
              { value: 'coexist', label: 'Coexist — both sources valid within their scope' },
              { value: 'hierarchy', label: 'Hierarchy — one source is the primary authority' },
              { value: 'pending_revision', label: 'Pending Revision — one figure is preliminary' },
              { value: 'escalate', label: 'Escalate — requires deeper investigation' },
            ]}
          />

          <div className="flex flex-col gap-1">
            <label className="text-2xs font-medium text-text-primary">
              Resolution note <span className="text-danger">*</span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded border border-border bg-bg-subtle text-xs focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
              placeholder="Explain the resolution decision…"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setResolving(null)}>Cancel</Button>
            <Button loading={saving} onClick={handleResolve} disabled={!strategy || !note}>
              Mark Resolved
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
