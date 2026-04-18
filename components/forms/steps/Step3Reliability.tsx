'use client'

import { Textarea } from '@/components/ui/Textarea'
import type { FormData } from '../SubmissionForm'

interface Props { data: FormData; update: (p: Partial<FormData>) => void }

function RadioGroup({
  name, value, options, onChange,
}: {
  name: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {options.map((o) => (
        <label key={o.value} className="flex items-center gap-2 cursor-pointer group">
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="w-3.5 h-3.5 accent-primary"
          />
          <span className="text-xs text-text-primary group-hover:text-primary transition-colors">{o.label}</span>
        </label>
      ))}
    </div>
  )
}

export function Step3Reliability({ data, update }: Props) {
  const methodology = (data.s3_has_methodology as string) || ''

  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-semibold text-text-primary">3. How reliable is this document?</h2>
        <p className="text-2xs text-text-secondary mt-1">Help us understand how much to trust what this document says.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-2xs font-medium text-text-primary">
          Does the document explain how the data was collected? <span className="text-danger">*</span>
        </label>
        <RadioGroup
          name="s3_has_methodology"
          value={methodology}
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'partially', label: 'Partially' },
          ]}
          onChange={(v) => update({ s3_has_methodology: v })}
        />
      </div>

      {(methodology === 'yes' || methodology === 'partially') && (
        <Textarea
          label="How was the data collected?"
          rows={4}
          value={(data.s3_methodology_note as string) || ''}
          onChange={(e) => update({ s3_methodology_note: e.target.value })}
          helper="Copy the description from the methodology section."
        />
      )}

      <Textarea
        label="Are there any groups, areas, or time periods NOT covered by this data?"
        rows={3}
        value={(data.s3_coverage_gaps as string) || ''}
        onChange={(e) => update({ s3_coverage_gaps: e.target.value })}
        helper="E.g. 'Excludes institutional households. No district-level data for Sabah.' Leave blank if none stated."
      />

      <div className="flex flex-col gap-2">
        <label className="text-2xs font-medium text-text-primary">
          Is this officially published data or an estimate? <span className="text-danger">*</span>
        </label>
        <RadioGroup
          name="s3_data_type"
          value={(data.s3_data_type as string) || ''}
          options={[
            { value: 'official_published', label: 'Official published data' },
            { value: 'official_estimate', label: 'Official estimate or projection' },
            { value: 'third_party_estimate', label: 'Third-party estimate' },
            { value: 'journalist_calculation', label: "Journalist's own calculation" },
          ]}
          onChange={(v) => update({ s3_data_type: v })}
        />
      </div>
    </div>
  )
}
