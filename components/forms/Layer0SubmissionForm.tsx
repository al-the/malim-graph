'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { StepProgress } from '@/components/ui/StepProgress'
import { Button } from '@/components/ui/Button'
import { L0Step1Identity } from './steps/L0Step1Identity'
import { L0Step2Details } from './steps/L0Step2Details'
import { L0Step3Review } from './steps/L0Step3Review'
import toast from 'react-hot-toast'
import Link from 'next/link'

const STEPS = ['Identity', 'Document Details', 'Review & Submit']
const DRAFT_KEY = 'malim_l0_submission_draft'

export interface L0FormData {
  s1_title_en: string
  s1_title_ms: string
  s1_source_authority: string
  s1_doc_type: string
  s1_series: string
  s1_url: string
  s1_published_date: string
  s1_ref_period_start: string | null
  s1_ref_period_end: string | null
  s1_language: string[]

  s2_summary_en: string
  s2_summary_ms: string
  s2_doc_status: 'preliminary' | 'revised' | 'final' | 'not_applicable'
  s2_updates_previous: boolean
  s2_updates_which: string
  s2_topics: string[]
  s2_geography: string[]

  checklist: {
    url_is_direct: boolean
    title_is_exact: boolean
    read_document: boolean
    is_original_work: boolean
  }
}

const INITIAL_DATA: L0FormData = {
  s1_title_en: '',
  s1_title_ms: '',
  s1_source_authority: '',
  s1_doc_type: '',
  s1_series: '',
  s1_url: '',
  s1_published_date: '',
  s1_ref_period_start: null,
  s1_ref_period_end: null,
  s1_language: ['en'],
  s2_summary_en: '',
  s2_summary_ms: '',
  s2_doc_status: 'final',
  s2_updates_previous: false,
  s2_updates_which: '',
  s2_topics: [],
  s2_geography: [],
  checklist: {
    url_is_direct: false,
    title_is_exact: false,
    read_document: false,
    is_original_work: false,
  },
}

export function Layer0SubmissionForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<L0FormData>(INITIAL_DATA)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showRestore, setShowRestore] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) setShowRestore(true)
  }, [])

  const restoreDraft = () => {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) {
      try {
        setData(JSON.parse(saved) as L0FormData)
        setShowRestore(false)
        toast.success('Draft restored')
      } catch {
        localStorage.removeItem(DRAFT_KEY)
        setShowRestore(false)
      }
    }
  }

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setShowRestore(false)
  }

  // Auto-save every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
      setLastSaved(new Date())
    }, 30000)
    return () => clearInterval(timer)
  }, [data])

  const update = useCallback((patch: Partial<L0FormData>) => {
    setData((prev) => ({ ...prev, ...patch }))
  }, [])

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/submissions/layer0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, status: 'pending', layer: 0 }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || 'Submission failed')
      }
      localStorage.removeItem(DRAFT_KEY)
      setSubmitted(true)
      toast.success('Submitted to Layer 0 review queue.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit. Please try again.')
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
          <p className="text-xs text-text-secondary mb-6">Submitted to Layer 0 review queue.</p>
          <div className="flex justify-center gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setSubmitted(false)
                setStep(1)
                setData(INITIAL_DATA)
              }}
            >
              Submit another
            </Button>
            <Button onClick={() => router.push('/submissions')}>
              View my submissions
            </Button>
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
          <p className="text-xs text-warning font-medium">
            You have an unsaved draft. Would you like to restore it?
          </p>
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
        {step === 1 && <L0Step1Identity {...stepProps} />}
        {step === 2 && <L0Step2Details {...stepProps} />}
        {step === 3 && (
          <L0Step3Review
            {...stepProps}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          Previous
        </Button>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-2xs text-text-disabled">
              Last saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {step < 3 && (
            <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
          )}
        </div>
      </div>
    </div>
  )
}
