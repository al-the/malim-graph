'use client'

import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { TagInput } from '@/components/ui/TagInput'
import { Button } from '@/components/ui/Button'
import { TOPICS, TOPICS_BY_AUTHORITY, GEOGRAPHIES } from '@/lib/types'
import type { FormData } from '../SubmissionForm'
import type { KeyStat } from '@/lib/types'

interface Props { data: FormData; update: (p: Partial<FormData>) => void }

const DATA_STATUS = [
  { value: 'preliminary', label: 'Preliminary' },
  { value: 'revised', label: 'Revised' },
  { value: 'final', label: 'Final' },
  { value: 'not_applicable', label: 'Not applicable' },
]

export function Step2Content({ data, update }: Props) {
  const summary = (data.s2_summary as string) || ''
  const topics = (data.s2_topics as string[]) || []
  const geography = (data.s2_geography as string[]) || []
  const stats = (data.s2_key_stats as KeyStat[]) || []
  const authority = (data.s1_source_authority as string) || ''
  const availableTopics = TOPICS_BY_AUTHORITY[authority] ?? TOPICS

  const addStat = () => {
    if (stats.length >= 5) return
    update({ s2_key_stats: [...stats, { label: '', value: '', unit: '', period: '', geography: '' }] })
  }

  const updateStat = (i: number, field: keyof KeyStat, val: string) => {
    const next = stats.map((s, idx) => idx === i ? { ...s, [field]: val } : s)
    update({ s2_key_stats: next })
  }

  const removeStat = (i: number) => {
    update({ s2_key_stats: stats.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-semibold text-text-primary">2. What is this document about?</h2>
        <p className="text-2xs text-text-secondary mt-1">Read the executive summary before answering. Tell us what you found.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-2xs font-medium text-text-primary">
          In one sentence, what is the main point of this document? <span className="text-danger">*</span>
        </label>
        <p className="text-2xs text-text-secondary">Write as if explaining to a curious colleague who hasn&apos;t read it.</p>
        <textarea
          maxLength={150}
          rows={3}
          value={summary}
          onChange={(e) => update({ s2_summary: e.target.value })}
          className={`px-3 py-2 rounded border bg-bg-subtle text-xs placeholder-text-disabled
            border-border focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 w-full resize-none
            ${summary.length > 130 ? 'border-danger' : ''}`}
          placeholder="The main finding of this document is…"
        />
        <div className="flex justify-end">
          <span className={`text-2xs ${summary.length > 130 ? 'text-danger font-medium' : 'text-text-disabled'}`}>
            {summary.length}/150
          </span>
        </div>
      </div>

      <TagInput
        label="What topics does this document cover?"
        required
        options={availableTopics}
        value={topics}
        onChange={(v) => update({ s2_topics: v })}
        helper={authority ? `Showing topics for ${authority}` : undefined}
      />

      <TagInput
        label="Which area does this cover?"
        required
        options={GEOGRAPHIES}
        value={geography}
        onChange={(v) => update({ s2_geography: v })}
      />

      {/* Key stats */}
      <div className="flex flex-col gap-2">
        <label className="text-2xs font-medium text-text-primary">Important statistics from this document</label>
        {stats.map((stat, i) => (
          <div key={i} className="border border-border rounded p-3 flex flex-col gap-2 bg-bg-subtle">
            <div className="flex justify-between items-center">
              <span className="text-2xs font-medium text-text-secondary">Statistic {i + 1}</span>
              {i > 0 && (
                <button onClick={() => removeStat(i)} className="text-text-disabled hover:text-danger text-xs">×</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Label (e.g. Median household income)" value={stat.label} onChange={(e) => updateStat(i, 'label', e.target.value)}
                className="h-9 px-3 rounded border border-border bg-bg-surface text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1" />
              <input placeholder="Value (e.g. 5,873)" value={stat.value} onChange={(e) => updateStat(i, 'value', e.target.value)}
                className="h-9 px-3 rounded border border-border bg-bg-surface text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1" />
              <input placeholder="Unit (e.g. RM per month)" value={stat.unit} onChange={(e) => updateStat(i, 'unit', e.target.value)}
                className="h-9 px-3 rounded border border-border bg-bg-surface text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1" />
              <input placeholder="Year or period (e.g. 2022)" value={stat.period} onChange={(e) => updateStat(i, 'period', e.target.value)}
                className="h-9 px-3 rounded border border-border bg-bg-surface text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1" />
              <input placeholder="Area covered (e.g. National)" value={stat.geography} onChange={(e) => updateStat(i, 'geography', e.target.value)}
                className="h-9 px-3 rounded border border-border bg-bg-surface text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 col-span-2" />
            </div>
          </div>
        ))}
        {stats.length < 5 && (
          <Button variant="ghost" size="sm" onClick={addStat} className="self-start mt-1">
            + Add another statistic
          </Button>
        )}
      </div>

      <Textarea
        label="Who or what is this document mainly about?"
        rows={3}
        value={(data.s2_main_subjects as string) || ''}
        onChange={(e) => update({ s2_main_subjects: e.target.value })}
        helper="Name the organisations, people, or places that are the primary subjects."
      />

      <Select
        label="Is this data preliminary, revised, or final?"
        required
        value={(data.s2_data_status as string) || ''}
        onChange={(e) => update({ s2_data_status: e.target.value })}
        placeholder="Select…"
        options={DATA_STATUS}
      />
    </div>
  )
}
