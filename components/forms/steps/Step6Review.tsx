'use client'

import { Button } from '@/components/ui/Button'
import type { FormData } from '../SubmissionForm'
import type { KeyStat, S6Checklist } from '@/lib/types'

interface Props {
  data: FormData
  update: (p: Partial<FormData>) => void
  onSubmit: () => void
  submitting: boolean
}

const CHECKLIST_ITEMS: { key: keyof S6Checklist; label: string }[] = [
  { key: 'read_executive_summary', label: 'I have read at least the executive summary and key findings' },
  { key: 'url_is_direct', label: 'The URL links directly to this document (not a search results page)' },
  { key: 'stats_have_units', label: 'Every statistic I listed includes units and a reference year' },
  { key: 'is_original_work', label: 'This is my own original submission' },
  { key: 'confidence_is_honest', label: 'My confidence rating honestly reflects my understanding' },
]

function SectionReview({ title, rows }: { title: string; rows: { label: string; value: string | string[] | undefined | null }[] }) {
  const visible = rows.filter((r) => r.value && (Array.isArray(r.value) ? r.value.length > 0 : String(r.value).trim()))
  if (visible.length === 0) return null
  return (
    <div className="border border-border rounded overflow-hidden">
      <div className="px-4 py-2 bg-bg-subtle border-b border-border">
        <p className="text-2xs font-semibold text-text-primary uppercase tracking-wider">{title}</p>
      </div>
      <div className="divide-y divide-border">
        {visible.map((r) => (
          <div key={r.label} className="px-4 py-2 flex gap-4">
            <span className="text-2xs text-text-secondary w-40 flex-shrink-0">{r.label}</span>
            <span className="text-xs text-text-primary">{Array.isArray(r.value) ? r.value.join(', ') : String(r.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Step6Review({ data, update, onSubmit, submitting }: Props) {
  const checklist = (data.s6_checklist as S6Checklist) || {
    read_executive_summary: false,
    url_is_direct: false,
    stats_have_units: false,
    is_original_work: false,
    confidence_is_honest: false,
  }
  const allChecked = Object.values(checklist).every(Boolean)
  const stats = (data.s2_key_stats as KeyStat[]) || []

  const toggle = (key: keyof S6Checklist) => {
    update({ s6_checklist: { ...checklist, [key]: !checklist[key] } })
  }

  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-semibold text-text-primary">6. Review & Submit</h2>
        <p className="text-2xs text-text-secondary mt-1">Review your entry before submitting. Once submitted, you cannot edit it.</p>
      </div>

      {/* Summary */}
      <div className="flex flex-col gap-3">
        <SectionReview title="Identity" rows={[
          { label: 'Title (EN)', value: data.s1_title_en as string },
          { label: 'Title (MS)', value: data.s1_title_ms as string },
          { label: 'Source', value: data.s1_source_authority as string },
          { label: 'Doc type', value: data.s1_doc_type as string },
          { label: 'URL', value: data.s1_url as string },
          { label: 'Published', value: data.s1_published_date as string },
          { label: 'Language', value: data.s1_language as string[] },
        ]} />

        <SectionReview title="Content" rows={[
          { label: 'Summary', value: data.s2_summary as string },
          { label: 'Topics', value: data.s2_topics as string[] },
          { label: 'Geography', value: data.s2_geography as string[] },
          { label: 'Data status', value: data.s2_data_status as string },
          { label: 'Key stats', value: stats.length > 0 ? `${stats.length} statistic(s)` : null },
        ]} />

        <SectionReview title="Reliability" rows={[
          { label: 'Has methodology', value: data.s3_has_methodology as string },
          { label: 'Data type', value: data.s3_data_type as string },
          { label: 'Coverage gaps', value: data.s3_coverage_gaps as string },
        ]} />

        <SectionReview title="Connections" rows={[
          { label: 'Has connections', value: data.s4_has_connections as string },
          { label: 'Has conflict', value: data.s4_has_conflict as string },
          { label: 'Conflict severity', value: data.s4_conflict_severity as string },
        ]} />

        <SectionReview title="Notes" rows={[
          { label: 'Difficulty', value: data.s5_difficulty ? `${data.s5_difficulty}/5` : null },
          { label: 'Confidence', value: data.s5_confidence ? `${data.s5_confidence}/5` : null },
          { label: 'Unusual findings', value: data.s5_unusual_findings as string },
        ]} />
      </div>

      {/* Checklist */}
      <div className="border border-border rounded p-4">
        <p className="text-2xs font-semibold text-text-primary uppercase tracking-wider mb-3">Before you submit, confirm these:</p>
        <div className="flex flex-col gap-3">
          {CHECKLIST_ITEMS.map(({ key, label }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist[key] || false}
                onChange={() => toggle(key)}
                className="w-4 h-4 mt-0.5 accent-primary rounded"
              />
              <span className="text-xs text-text-primary">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <Button
        onClick={onSubmit}
        loading={submitting}
        disabled={!allChecked}
        className="w-full"
      >
        Submit Entry
      </Button>

      {!allChecked && (
        <p className="text-2xs text-text-secondary text-center">Check all five items above to enable submission.</p>
      )}
    </div>
  )
}
