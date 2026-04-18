'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { StepProgress } from '@/components/ui/StepProgress'
import { Button } from '@/components/ui/Button'
import { Step1Identity } from './steps/Step1Identity'
import { Step2Content } from './steps/Step2Content'
import { Step3Reliability } from './steps/Step3Reliability'
import { Step4Connections } from './steps/Step4Connections'
import { Step5Notes } from './steps/Step5Notes'
import { Step6Review } from './steps/Step6Review'
import toast from 'react-hot-toast'

const STEPS = ['Identity', 'Content', 'Reliability', 'Connections', 'Notes', 'Review & Submit']
const DRAFT_KEY = 'malim_submission_draft'

export type FormData = Record<string, unknown>

export function SubmissionForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<FormData>({
    s1_language: [],
    s2_topics: [],
    s2_geography: [],
    s2_key_stats: [],
    s2_data_status: 'final',
    s3_has_methodology: '',
    s3_methodology_note: '',
    s3_coverage_gaps: '',
    s3_data_type: '',
    s4_has_connections: 'no',
    s4_cited_docs: [],
    s4_updates_previous: 'no',
    s4_has_conflict: 'no',
    s4_conflict_reason: '',
    s4_conflict_severity: '',
    s5_difficulty: 0,
    s5_confidence: 0,
    s6_checklist: {
      read_executive_summary: false,
      url_is_direct: false,
      stats_have_units: false,
      is_original_work: false,
      confidence_is_honest: false,
    },
  })
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showRestore, setShowRestore] = useState(false)

  // Check for draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) setShowRestore(true)
  }, [])

  const restoreDraft = () => {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) {
      setData(JSON.parse(saved))
      setShowRestore(false)
      toast.success('Draft restored')
    }
  }

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setShowRestore(false)
  }

  // Auto-save every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
      setLastSaved(new Date())
    }, 30000)
    return () => clearInterval(timer)
  }, [data])

  const update = useCallback((patch: Partial<FormData>) => {
    setData((prev) => ({ ...prev, ...patch }))
  }, [])

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, status: 'pending' }),
      })
      if (!res.ok) throw new Error()
      localStorage.removeItem(DRAFT_KEY)
      setSubmitted(true)
      toast.success('Submission created successfully')
    } catch {
      toast.error('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-[760px] mx-auto">
        <div className="bg-bg-surface border border-border rounded-lg shadow-card p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Submitted!</h2>
          <p className="text-xs text-text-secondary mb-6">Your entry is now in the review queue.</p>
          <div className="flex justify-center gap-3">
            <Button variant="ghost" onClick={() => { setSubmitted(false); setStep(1); setData({}) }}>
              Submit another
            </Button>
            <Button onClick={() => router.push('/submissions')}>View my submissions</Button>
          </div>
        </div>
      </div>
    )
  }

  const stepProps = { data, update }

  return (
    <div className="max-w-[760px] mx-auto flex flex-col gap-6">
      {showRestore && (
        <div className="bg-amber-50 border border-amber-200 rounded px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-warning font-medium">You have an unsaved draft. Would you like to restore it?</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={discardDraft}>Discard</Button>
            <Button size="sm" onClick={restoreDraft}>Restore draft</Button>
          </div>
        </div>
      )}

      {/* Step progress */}
      <div className="bg-bg-surface border border-border rounded-lg shadow-card p-5">
        <StepProgress steps={STEPS} current={step} />
      </div>

      {/* Step content */}
      <div className="bg-bg-surface border border-border rounded-lg shadow-card">
        {step === 1 && <Step1Identity {...stepProps} />}
        {step === 2 && <Step2Content {...stepProps} />}
        {step === 3 && <Step3Reliability {...stepProps} />}
        {step === 4 && <Step4Connections {...stepProps} />}
        {step === 5 && <Step5Notes {...stepProps} />}
        {step === 6 && <Step6Review {...stepProps} onSubmit={handleSubmit} submitting={submitting} />}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
            Previous
          </Button>
        </div>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-2xs text-text-disabled">Last saved {lastSaved.toLocaleTimeString()}</span>
          )}
          {step < 6 ? (
            <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
