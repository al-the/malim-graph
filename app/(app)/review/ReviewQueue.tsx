'use client'

import { useEffect, useState, useCallback } from 'react'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SubmissionDetail } from '../submissions/SubmissionDetail'
import toast from 'react-hot-toast'
import type { Submission } from '@/lib/types'

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function DaysWaiting({ date }: { date: string }) {
  const days = daysSince(date)
  const cls = days > 7 ? 'text-danger' : days >= 4 ? 'text-warning' : 'text-text-secondary'
  return <span className={`mono ${cls}`}>{days}d</span>
}

export function ReviewQueue() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState<Submission | null>(null)
  const [decision, setDecision] = useState<'approve' | 'reject' | 'flag' | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/submissions?status=pending&limit=50')
    const data = await res.json()
    // Sort oldest first
    const sorted = (data.submissions || []).sort((a: Submission, b: Submission) =>
      a.submitted_at.localeCompare(b.submitted_at),
    )
    setSubmissions(sorted)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleReview() {
    if (!reviewing || !decision) return
    if ((decision === 'reject' || decision === 'flag') && note.length < 20) {
      toast.error('Please provide at least 20 characters.')
      return
    }

    setSaving(true)
    try {
      const statusMap = { approve: 'approved', reject: 'rejected', flag: 'flagged' } as const
      const res = await fetch(`/api/submissions/${reviewing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusMap[decision],
          review_note: note || null,
          reviewed_at: new Date().toISOString(),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Submission ${statusMap[decision]}.`)
      setReviewing(null)
      setDecision(null)
      setNote('')
      load()
    } catch {
      toast.error('Failed to save review.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="bg-bg-surface border border-border rounded-lg shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <h2 className="text-lg font-semibold text-text-primary">Pending Submissions</h2>
          <Badge variant="pending">{submissions.length}</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Porter</th>
                <th>Source</th>
                <th>Submitted</th>
                <th>Waiting</th>
                <th>Conflict</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTable rows={6} cols={7} />
              ) : submissions.length === 0 ? (
                <EmptyState message="Queue is clear" description="All submissions have been reviewed." />
              ) : (
                submissions.map((s) => (
                  <tr key={s.id}>
                    <td className="max-w-[180px] truncate" title={s.s1_title_en}>{s.s1_title_en}</td>
                    <td className="text-text-secondary">{s.porter_name}</td>
                    <td className="text-text-secondary">{s.s1_source_authority}</td>
                    <td className="mono text-text-secondary">{s.submitted_at?.slice(0, 10)}</td>
                    <td><DaysWaiting date={s.submitted_at} /></td>
                    <td>
                      {s.s4_has_conflict === 'yes' && (
                        <Badge variant={s.s4_conflict_severity as 'minor' | 'moderate' | 'major' || 'minor'} />
                      )}
                    </td>
                    <td>
                      <Button size="sm" onClick={() => { setReviewing(s); setDecision(null); setNote('') }}>
                        Review
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review modal */}
      <Modal open={!!reviewing} onClose={() => setReviewing(null)} title={reviewing?.s1_title_en} width={620}>
        <div className="p-6 flex flex-col gap-4">
          {reviewing?.s4_has_conflict === 'yes' && (
            <div className="bg-cyan-50 border border-cyan-200 rounded px-4 py-3 text-xs text-accent font-medium">
              ⚠ Porter flagged a potential data conflict — review Section 4 carefully.
            </div>
          )}
          {reviewing && <SubmissionDetail submission={reviewing} />}

          {/* Decision panel */}
          <div className="border-t border-border pt-4 flex flex-col gap-3">
            <p className="text-2xs font-semibold text-text-primary uppercase tracking-wider">Review Decision</p>
            <div className="flex gap-2">
              <Button variant={decision === 'approve' ? 'success' : 'ghost'} onClick={() => setDecision('approve')}>
                Approve
              </Button>
              <Button variant={decision === 'reject' ? 'danger' : 'ghost'} onClick={() => setDecision('reject')}>
                Reject
              </Button>
              <Button variant={decision === 'flag' ? 'purple' : 'ghost'} onClick={() => setDecision('flag')}>
                Flag
              </Button>
            </div>

            {decision === 'approve' && (
              <div className="flex flex-col gap-1">
                <label className="text-2xs text-text-secondary">Add a review note (optional)</label>
                <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border bg-bg-subtle text-xs focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1" />
              </div>
            )}
            {decision === 'reject' && (
              <div className="flex flex-col gap-1">
                <label className="text-2xs text-text-secondary">
                  Rejection reason (required — Porter will see this) <span className="text-danger">*</span>
                </label>
                <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border bg-bg-subtle text-xs focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1" />
                {note.length < 20 && note.length > 0 && (
                  <p className="text-2xs text-danger">Minimum 20 characters required ({20 - note.length} more)</p>
                )}
              </div>
            )}
            {decision === 'flag' && (
              <div className="flex flex-col gap-1">
                <label className="text-2xs text-text-secondary">
                  Flag note — describe what needs investigation <span className="text-danger">*</span>
                </label>
                <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border bg-bg-subtle text-xs focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1" />
              </div>
            )}

            {decision && (
              <Button loading={saving} onClick={handleReview} className="self-start">
                Confirm {decision === 'approve' ? 'Approval' : decision === 'reject' ? 'Rejection' : 'Flag'}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}
