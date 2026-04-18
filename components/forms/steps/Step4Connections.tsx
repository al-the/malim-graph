'use client'

import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import type { FormData } from '../SubmissionForm'

interface Props { data: FormData; update: (p: Partial<FormData>) => void }

function RadioGroup({ name, value, options, onChange }: {
  name: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {options.map((o) => (
        <label key={o.value} className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name={name} value={o.value} checked={value === o.value}
            onChange={() => onChange(o.value)} className="w-3.5 h-3.5 accent-primary" />
          <span className="text-xs text-text-primary">{o.label}</span>
        </label>
      ))}
    </div>
  )
}

export function Step4Connections({ data, update }: Props) {
  const connections = (data.s4_has_connections as string) || 'no'
  const citedDocs = (data.s4_cited_docs as string[]) || []
  const hasConflict = (data.s4_has_conflict as string) || 'no'
  const updatesP = (data.s4_updates_previous as string) || 'no'

  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-semibold text-text-primary">4. How does this document connect?</h2>
        <p className="text-2xs text-text-secondary mt-1">This is the most important section. Think about what else you&apos;ve read that relates to this document.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-2xs font-medium text-text-primary">
          Does this document mention, reference, or respond to any other document? <span className="text-danger">*</span>
        </label>
        <RadioGroup name="s4_has_connections" value={connections}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'not_sure', label: 'Not sure' }]}
          onChange={(v) => update({ s4_has_connections: v })} />
      </div>

      {connections === 'yes' && (
        <div className="flex flex-col gap-4 pl-4 border-l-2 border-border">
          {/* Cited documents */}
          <div className="flex flex-col gap-2">
            <label className="text-2xs font-medium text-text-primary">Which documents does it explicitly cite?</label>
            <p className="text-2xs text-text-secondary">Name + publisher is enough. E.g. &apos;Mid-Term Review of 12th Malaysia Plan, EPU, 2023&apos;</p>
            {citedDocs.map((doc, i) => (
              <div key={i} className="flex gap-2">
                <input value={doc} onChange={(e) => {
                  const next = citedDocs.map((d, idx) => idx === i ? e.target.value : d)
                  update({ s4_cited_docs: next })
                }}
                  className="flex-1 h-9 px-3 rounded border border-border bg-bg-subtle text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
                  placeholder="Document name, publisher, year" />
                <button onClick={() => update({ s4_cited_docs: citedDocs.filter((_, idx) => idx !== i) })}
                  className="text-text-disabled hover:text-danger text-sm px-2">×</button>
              </div>
            ))}
            {citedDocs.length < 5 && (
              <Button variant="ghost" size="sm" onClick={() => update({ s4_cited_docs: [...citedDocs, ''] })} className="self-start">
                + Add another
              </Button>
            )}
          </div>

          {/* Updates previous */}
          <div className="flex flex-col gap-2">
            <label className="text-2xs font-medium text-text-primary">Does this document update or replace an older version?</label>
            <RadioGroup name="s4_updates_previous" value={updatesP}
              options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
              onChange={(v) => update({ s4_updates_previous: v })} />
          </div>
          {updatesP === 'yes' && (
            <input value={(data.s4_updates_which as string) || ''} onChange={(e) => update({ s4_updates_which: e.target.value })}
              placeholder="Which document does it replace?"
              className="h-9 px-3 rounded border border-border bg-bg-subtle text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 w-full" />
          )}

          <Textarea label="Was this document written in response to something specific?" rows={2}
            value={(data.s4_responds_to as string) || ''} onChange={(e) => update({ s4_responds_to: e.target.value })}
            helper="E.g. 'This is a parliamentary written reply to Question 441 raised in March 2023'" />

          <Textarea label="Does this document confirm findings from another document you've seen?" rows={2}
            value={(data.s4_corroborates as string) || ''} onChange={(e) => update({ s4_corroborates: e.target.value })}
            helper="Name the other document and what it agrees on." />
        </div>
      )}

      {/* Conflict */}
      <div className="flex flex-col gap-2">
        <label className="text-2xs font-medium text-text-primary">
          Does this document report a number that conflicts with another source you know of? <span className="text-danger">*</span>
        </label>
        <RadioGroup name="s4_has_conflict" value={hasConflict}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'not_sure', label: 'Not sure' }]}
          onChange={(v) => update({ s4_has_conflict: v })} />
      </div>

      {hasConflict === 'yes' && (
        <div className="flex flex-col gap-4 pl-4 border-l-2 border-amber-300 bg-amber-50 p-4 rounded">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-2xs font-medium text-text-primary">Which source reports a different number?</label>
              <input value={(data.s4_conflict_source as string) || ''} onChange={(e) => update({ s4_conflict_source: e.target.value })}
                className="h-9 px-3 rounded border border-border bg-bg-surface text-xs focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-2xs font-medium text-text-primary">What value does that source report?</label>
              <input value={(data.s4_conflict_value as string) || ''} onChange={(e) => update({ s4_conflict_value: e.target.value })}
                placeholder="Include units (e.g. '2 billion kg')"
                className="h-9 px-3 rounded border border-border bg-bg-surface text-xs focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1" />
            </div>
          </div>

          <Select label="Why do you think they differ?" value={(data.s4_conflict_reason as string) || ''}
            onChange={(e) => update({ s4_conflict_reason: e.target.value })} placeholder="Select reason…"
            options={[
              { value: 'different_measurement_method', label: 'Different measurement method' },
              { value: 'different_coverage', label: 'Different coverage or population scope' },
              { value: 'different_definition', label: 'Different definition of the indicator' },
              { value: 'one_preliminary', label: 'One figure is preliminary, the other is final' },
              { value: 'possible_error', label: 'Possible error in one source' },
              { value: 'unknown', label: "I don't know" },
            ]} />

          <div className="flex flex-col gap-2">
            <label className="text-2xs font-medium text-text-primary">How serious is this difference?</label>
            <RadioGroup name="s4_conflict_severity" value={(data.s4_conflict_severity as string) || ''}
              options={[
                { value: 'minor', label: 'Minor — less than 5%, likely rounding' },
                { value: 'moderate', label: 'Moderate — 5 to 20%, worth noting' },
                { value: 'major', label: 'Major — more than 20%, needs investigation' },
              ]}
              onChange={(v) => update({ s4_conflict_severity: v })} />
          </div>
        </div>
      )}
    </div>
  )
}
