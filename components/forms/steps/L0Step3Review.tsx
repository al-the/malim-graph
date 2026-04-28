'use client'

import { Badge } from '@/components/ui/Badge'
import type { L0FormData } from '../Layer0SubmissionForm'
import type { SubmissionStatus } from '@/lib/types'

interface Props {
  data: L0FormData
  update: (patch: Partial<L0FormData>) => void
  onSubmit: () => void
  submitting: boolean
}

const CHECKLIST_ITEMS: Array<{ key: keyof L0FormData['checklist']; label: string }> = [
  { key: 'url_is_direct', label: 'The URL links directly to this document' },
  { key: 'title_is_exact', label: 'I copied the title exactly as it appears on the document' },
  { key: 'read_document', label: 'I have read at least the introduction or executive summary' },
  { key: 'is_original_work', label: 'This is my own original submission' },
]

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-2xs font-medium text-text-disabled uppercase tracking-wider">{label}</dt>
      <dd className="text-xs text-text-primary">{value}</dd>
    </div>
  )
}

export function L0Step3Review({ data, update, onSubmit, submitting }: Props) {
  const allChecked = CHECKLIST_ITEMS.every((item) => data.checklist[item.key])

  function toggleCheck(key: keyof L0FormData['checklist']) {
    update({ checklist: { ...data.checklist, [key]: !data.checklist[key] } })
  }

  const languageLabel = () => {
    const l = data.s1_language
    if (l.includes('en') && l.includes('ms')) return 'English & Bahasa Malaysia'
    if (l.includes('ms')) return 'Bahasa Malaysia'
    return 'English'
  }

  const docStatusLabel = () => {
    const map: Record<string, string> = {
      preliminary: 'Preliminary',
      revised: 'Revised',
      final: 'Final',
      not_applicable: 'Not applicable',
    }
    return map[data.s2_doc_status] || data.s2_doc_status
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Review before submitting</h2>
        <p className="text-2xs text-text-secondary mt-1">
          Once submitted, your entry enters the review queue. You cannot edit it after submission.
        </p>
      </div>

      {/* Step 1 summary */}
      <div className="bg-bg-subtle border border-border rounded-lg p-4 flex flex-col gap-3">
        <p className="text-2xs font-semibold text-text-disabled uppercase tracking-wider">
          Step 1 — Document Identity
        </p>
        <dl className="flex flex-col gap-2">
          <FieldRow label="Title (English)" value={data.s1_title_en} />
          <FieldRow label="Title (Bahasa Malaysia)" value={data.s1_title_ms} />
          <FieldRow label="Publisher" value={data.s1_source_authority} />
          <FieldRow label="Document type" value={data.s1_doc_type} />
          <FieldRow label="Series / code" value={data.s1_series} />
          <FieldRow
            label="URL"
            value={
              data.s1_url ? (
                <a
                  href={data.s1_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline break-all"
                >
                  {data.s1_url}
                </a>
              ) : null
            }
          />
          <FieldRow label="Published" value={data.s1_published_date} />
          <FieldRow
            label="Reference period"
            value={
              data.s1_ref_period_start
                ? `${data.s1_ref_period_start}${data.s1_ref_period_end ? ` — ${data.s1_ref_period_end}` : ''}`
                : null
            }
          />
          <FieldRow label="Language" value={languageLabel()} />
        </dl>
      </div>

      {/* Step 2 summary */}
      <div className="bg-bg-subtle border border-border rounded-lg p-4 flex flex-col gap-3">
        <p className="text-2xs font-semibold text-text-disabled uppercase tracking-wider">
          Step 2 — Document Details
        </p>
        <dl className="flex flex-col gap-2">
          <FieldRow label="Summary (English)" value={data.s2_summary_en} />
          <FieldRow label="Summary (Bahasa Malaysia)" value={data.s2_summary_ms} />
          <FieldRow label="Document status" value={docStatusLabel()} />
          <FieldRow
            label="Updates previous edition"
            value={
              data.s2_updates_previous
                ? `Yes — ${data.s2_updates_which || '(not specified)'}`
                : 'No'
            }
          />
          <FieldRow
            label="Topics"
            value={
              data.s2_topics.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {data.s2_topics.map((t) => (
                    <span
                      key={t}
                      className="inline-flex px-2 py-0.5 rounded-full bg-primary/10 text-primary text-2xs font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null
            }
          />
          <FieldRow
            label="Geography"
            value={
              data.s2_geography.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {data.s2_geography.map((g) => (
                    <span
                      key={g}
                      className="inline-flex px-2 py-0.5 rounded-full bg-accent/10 text-accent text-2xs font-medium"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              ) : null
            }
          />
        </dl>
      </div>

      {/* Checklist */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold text-text-primary">
          Pre-submit checklist — all items must be checked
        </p>
        <div className="flex flex-col gap-2">
          {CHECKLIST_ITEMS.map((item) => (
            <label key={item.key} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data.checklist[item.key]}
                onChange={() => toggleCheck(item.key)}
                className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
              />
              <span className="text-xs text-text-primary">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Submit button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!allChecked || submitting}
        className={`self-start px-6 h-9 rounded text-xs font-semibold transition-colors focus-ring ${
          allChecked && !submitting
            ? 'bg-primary text-white hover:bg-primary-hover'
            : 'bg-bg-subtle text-text-disabled cursor-not-allowed'
        }`}
      >
        {submitting ? 'Submitting…' : 'Submit Entry'}
      </button>
    </div>
  )
}

// Re-export SubmissionStatus for use in this file
export type { SubmissionStatus }
