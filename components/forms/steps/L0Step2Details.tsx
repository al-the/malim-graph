'use client'

import { LAYER0_TOPICS, GEOGRAPHIES } from '@/lib/types'
import type { L0FormData } from '../Layer0SubmissionForm'

interface Props {
  data: L0FormData
  update: (patch: Partial<L0FormData>) => void
}

const MAX_SUMMARY = 150
const WARN_SUMMARY = 130

const DOC_STATUS_OPTIONS = [
  { value: 'preliminary', label: 'Preliminary', desc: 'data may be revised later' },
  { value: 'revised', label: 'Revised', desc: 'this updates a previously published figure' },
  { value: 'final', label: 'Final', desc: 'no further revisions expected' },
  { value: 'not_applicable', label: 'Not applicable', desc: 'not a statistical document' },
] as const

function TagGroup({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`px-2.5 py-1 rounded text-2xs font-medium border transition-colors focus-ring ${
              active
                ? 'bg-primary text-white border-primary'
                : 'bg-bg-subtle text-text-secondary border-border hover:text-text-primary'
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
}

export function L0Step2Details({ data, update }: Props) {
  const summaryEnLen = (data.s2_summary_en || '').length
  const summaryMsLen = (data.s2_summary_ms || '').length

  const summaryEnColor =
    summaryEnLen > MAX_SUMMARY
      ? 'text-danger'
      : summaryEnLen > WARN_SUMMARY
      ? 'text-warning'
      : 'text-text-disabled'

  const summaryMsColor =
    summaryMsLen > MAX_SUMMARY
      ? 'text-danger'
      : summaryMsLen > WARN_SUMMARY
      ? 'text-warning'
      : 'text-text-disabled'

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Tell us about this document</h2>
        <p className="text-2xs text-text-secondary mt-1">
          Read at minimum the executive summary and introduction before completing this section.
        </p>
      </div>

      {/* Summary EN */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-text-primary">
          One-sentence summary (English) <span className="text-danger">*</span>
        </label>
        <textarea
          rows={2}
          maxLength={MAX_SUMMARY}
          value={data.s2_summary_en || ''}
          onChange={(e) => update({ s2_summary_en: e.target.value })}
          className="w-full px-3 py-2 rounded border border-border bg-bg-subtle text-xs text-text-primary placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 resize-none"
          placeholder="e.g. This report presents findings on household income distribution across Malaysian states in 2022."
        />
        <div className="flex items-center justify-between">
          <p className="text-2xs text-text-secondary">
            What would you tell a colleague in one sentence? Write it as a statement, not a title.
          </p>
          <span className={`text-2xs ${summaryEnColor}`}>{summaryEnLen}/{MAX_SUMMARY}</span>
        </div>
      </div>

      {/* Summary MS */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-text-primary">
          One-sentence summary (Bahasa Malaysia)
        </label>
        <textarea
          rows={2}
          maxLength={MAX_SUMMARY}
          value={data.s2_summary_ms || ''}
          onChange={(e) => update({ s2_summary_ms: e.target.value })}
          className="w-full px-3 py-2 rounded border border-border bg-bg-subtle text-xs text-text-primary placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 resize-none"
          placeholder="Laporan ini membentangkan dapatan mengenai…"
        />
        <div className="flex items-center justify-between">
          <p className="text-2xs text-text-secondary">
            Leave blank if you are not comfortable summarising in Bahasa Malaysia
          </p>
          <span className={`text-2xs ${summaryMsColor}`}>{summaryMsLen}/{MAX_SUMMARY}</span>
        </div>
      </div>

      {/* Document status */}
      <div>
        <p className="text-xs font-medium text-text-primary mb-2">
          Document status <span className="text-danger">*</span>
        </p>
        <div className="flex flex-col gap-2">
          {DOC_STATUS_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="doc_status"
                value={opt.value}
                checked={data.s2_doc_status === opt.value}
                onChange={() => update({ s2_doc_status: opt.value })}
                className="mt-0.5 accent-primary"
              />
              <span className="text-xs text-text-primary">
                <span className="font-medium">{opt.label}</span>
                <span className="text-text-secondary"> — {opt.desc}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Updates previous */}
      <div>
        <p className="text-xs font-medium text-text-primary mb-2">
          Does this document update or replace a previous edition? <span className="text-danger">*</span>
        </p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="updates_previous"
              checked={data.s2_updates_previous === true}
              onChange={() => update({ s2_updates_previous: true })}
              className="accent-primary"
            />
            <span className="text-xs text-text-primary">Yes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="updates_previous"
              checked={data.s2_updates_previous === false}
              onChange={() => update({ s2_updates_previous: false })}
              className="accent-primary"
            />
            <span className="text-xs text-text-primary">No</span>
          </label>
        </div>

        {data.s2_updates_previous === true && (
          <div className="mt-3 pl-4 border-l-2 border-border">
            <label className="text-xs font-medium text-text-primary block mb-1">
              Which document does it replace?
            </label>
            <input
              type="text"
              value={data.s2_updates_which || ''}
              onChange={(e) => update({ s2_updates_which: e.target.value })}
              className="w-full h-9 px-3 rounded border border-border bg-bg-subtle text-xs text-text-primary placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
              placeholder="e.g. HIES 2019, DOSM, 2021"
            />
            <p className="text-2xs text-text-secondary mt-1">
              Name + publisher + year is enough.
            </p>
          </div>
        )}
      </div>

      {/* Topics */}
      <div>
        <p className="text-xs font-medium text-text-primary mb-1">
          What topics does this document cover? <span className="text-danger">*</span>
        </p>
        <TagGroup
          options={LAYER0_TOPICS}
          selected={data.s2_topics}
          onToggle={(v) => update({ s2_topics: toggle(data.s2_topics, v) })}
        />
      </div>

      {/* Geography */}
      <div>
        <p className="text-xs font-medium text-text-primary mb-1">
          Which geographic areas does this cover? <span className="text-danger">*</span>
        </p>
        <TagGroup
          options={GEOGRAPHIES}
          selected={data.s2_geography}
          onToggle={(v) => update({ s2_geography: toggle(data.s2_geography, v) })}
        />
      </div>
    </div>
  )
}
