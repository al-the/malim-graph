'use client'

import { useEffect, useState, useCallback } from 'react'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { L0SubmissionDetail } from '../submissions/L0SubmissionDetail'
import { SubmissionDetail } from '../submissions/SubmissionDetail'
import toast from 'react-hot-toast'
import type { Layer0Submission, Submission } from '@/lib/types'

type AnySubmission = Layer0Submission | Submission

function isLayer0(s: AnySubmission): s is Layer0Submission {
  return (s as Layer0Submission).layer === 0
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function DaysWaiting({ date }: { date: string }) {
  const days = daysSince(date)
  const cls = days > 7 ? 'text-danger' : days >= 4 ? 'text-warning' : 'text-text-secondary'
  return <span className={`mono ${cls}`}>{days}d</span>
}

type LayerTab = 'all' | '0'

const LAYER_TABS: Array<{ id: LayerTab; label: string; disabled?: boolean }> = [
  { id: 'all', label: 'All Layers' },
  { id: '0', label: 'Layer 0' },
]

const LOCKED_TABS = ['Layer 1 — coming soon']

export function ReviewQueue() {
  const [activeTab, setActiveTab] = useState<LayerTab>('0')
  const [submissions, setSubmissions] = useState<AnySubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState<AnySubmission | null>(null)
  const [decision, setDecision] = useState<'approve' | 'reject' | 'flag' | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (tab: LayerTab) => {
    setLoading(true)
    try {
      let url: string
      if (tab === '0') {
        url = '/api/submissions/layer0?status=pending&limit=50'
      } else {
        // All layers: fetch layer0 submissions (only layer implemented)
        url = '/api/submissions/layer0?status=pending&limit=50'
      }

      const res = await fetch(url)
      const data = await res.json() as { submissions: AnySubmission[] }
      const sorted = (data.submissions || []).sort((a, b) =>
        a.submitted_at.localeCompare(b.submitted_at),
      )
      setSubmissions(sorted)
    } catch {
      toast.error('Failed to load review queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(activeTab)
  }, [load, activeTab])

  async function handleReview() {
    if (!reviewing || !decision) return
    const d = decision
    if ((d === 'reject' || d === 'flag') && note.length < 20) {
      toast.error('Please provide at least 20 characters.')
      return
    }

    setSaving(true)
    try {
      const statusMap = { approve: 'approved', reject: 'rejected', flag: 'flagged' } as const
      const endpoint = isLayer0(reviewing)
        ? `/api/submissions/layer0/${reviewing.id}`
        : `/api/submissions/${reviewing.id}`

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusMap[d],
          review_note: note || null,
          reviewed_at: new Date().toISOString(),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Submission ${statusMap[d]}.`)
      if (d === 'approve' && isLayer0(reviewing)) {
        toast.success('Ingestion pipeline started — document will be indexed shortly.')
      }
      setReviewing(null)
      setDecision(null)
      setNote('')
      load(activeTab)
    } catch {
      toast.error('Failed to save review.')
    } finally {
      setSaving(false)
    }
  }

  const titleFor = (s: AnySubmission) =>
    isLayer0(s) ? s.s1_title_en : (s as Submission).s1_title_en
  const sourceFor = (s: AnySubmission) =>
    isLayer0(s) ? s.s1_source_authority : (s as Submission).s1_source_authority

  return (
    <>
      {/* Layer filter tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-border">
        {LAYER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors focus-ring -mb-px ${
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
        {LOCKED_TABS.map((label) => (
          <button
            key={label}
            type="button"
            disabled
            className="px-4 py-2 text-xs border-b-2 border-transparent text-text-disabled cursor-not-allowed opacity-60 -mb-px"
          >
            {label}
          </button>
        ))}
      </div>

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
                <th>Layer</th>
                <th>Submitted</th>
                <th>Waiting</th>
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
                    <td className="max-w-[180px] truncate" title={titleFor(s)}>{titleFor(s)}</td>
                    <td className="text-text-secondary">{s.porter_name}</td>
                    <td className="text-text-secondary">{sourceFor(s)}</td>
                    <td>
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-accent/10 text-accent text-2xs font-medium">
                        L{isLayer0(s) ? '0' : '?'}
                      </span>
                    </td>
                    <td className="mono text-text-secondary">{s.submitted_at?.slice(0, 10)}</td>
                    <td><DaysWaiting date={s.submitted_at} /></td>
                    <td>
                      <Button
                        size="sm"
                        onClick={() => {
                          setReviewing(s)
                          setDecision(null)
                          setNote('')
                        }}
                      >
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
      <Modal
        open={!!reviewing}
        onClose={() => setReviewing(null)}
        title={reviewing ? titleFor(reviewing) : ''}
        width={640}
      >
        <div className="p-6 flex flex-col gap-4">
          {reviewing && isLayer0(reviewing) ? (
            <L0SubmissionDetail submission={reviewing} />
          ) : reviewing ? (
            <SubmissionDetail submission={reviewing as Submission} />
          ) : null}

          {/* Decision panel */}
          <div className="border-t border-border pt-4 flex flex-col gap-3">
            <p className="text-2xs font-semibold text-text-primary uppercase tracking-wider">
              Review Decision
            </p>
            <div className="flex gap-2">
              <Button
                variant={decision === 'approve' ? 'success' : 'ghost'}
                onClick={() => setDecision('approve')}
              >
                Approve
              </Button>
              <Button
                variant={decision === 'reject' ? 'danger' : 'ghost'}
                onClick={() => setDecision('reject')}
              >
                Reject
              </Button>
              <Button
                variant={decision === 'flag' ? 'purple' : 'ghost'}
                onClick={() => setDecision('flag')}
              >
                Flag
              </Button>
            </div>

            {decision === 'approve' && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-2xs text-text-secondary">
                    Add a review note (optional)
                  </label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-border bg-bg-subtle text-xs focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
                  />
                </div>
                {reviewing && isLayer0(reviewing) && (
                  <p className="text-2xs text-accent bg-cyan-50 border border-cyan-200 rounded px-3 py-2">
                    Approving will trigger the ingestion pipeline — the document will be promoted to Layer 0 and chunked automatically.
                  </p>
                )}
              </>
            )}
            {(decision === 'reject' || decision === 'flag') && (
              <div className="flex flex-col gap-1">
                <label className="text-2xs text-text-secondary">
                  {decision === 'reject'
                    ? 'Rejection reason (required — Porter will see this)'
                    : 'Flag note — describe what needs investigation'}
                  <span className="text-danger"> *</span>
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border bg-bg-subtle text-xs focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
                />
                {note.length < 20 && note.length > 0 && (
                  <p className="text-2xs text-danger">
                    Minimum 20 characters required ({20 - note.length} more)
                  </p>
                )}
              </div>
            )}

            {decision && (
              <Button loading={saving} onClick={handleReview} className="self-start">
                {`Confirm ${decision === 'approve' ? 'Approval' : decision === 'reject' ? 'Rejection' : 'Flag'}`}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}
