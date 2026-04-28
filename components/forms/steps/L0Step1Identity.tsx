'use client'

import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { LAYER0_SOURCE_AUTHORITIES, LAYER0_DOC_TYPES } from '@/lib/types'
import type { L0FormData } from '../Layer0SubmissionForm'

interface Props {
  data: L0FormData
  update: (patch: Partial<L0FormData>) => void
}

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ms', label: 'Bahasa Malaysia' },
  { value: 'both', label: 'Both' },
]

export function L0Step1Identity({ data, update }: Props) {
  function toggleLanguage(val: string) {
    // "Both" means ['en','ms'], single selection means just that value
    if (val === 'both') {
      update({ s1_language: ['en', 'ms'] })
    } else {
      const current = data.s1_language
      const isBoth = current.includes('en') && current.includes('ms')
      if (isBoth) {
        update({ s1_language: [val] })
      } else if (current.includes(val)) {
        const next = current.filter((l) => l !== val)
        update({ s1_language: next.length ? next : [val] })
      } else {
        update({ s1_language: [...current, val] })
      }
    }
  }

  function selectedLanguageKey(): string {
    const l = data.s1_language
    if (l.includes('en') && l.includes('ms')) return 'both'
    if (l.includes('ms')) return 'ms'
    return 'en'
  }

  const urlValue = data.s1_url || ''
  const urlWarning = urlValue && !urlValue.startsWith('https://')
    ? 'URL should start with https://'
    : ''

  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-text-primary">What is this document?</h2>
        <p className="text-2xs text-text-secondary mt-1">
          Identify the document precisely. Every field here becomes a permanent record in the Knowledge Graph.
        </p>
      </div>

      {/* Title EN */}
      <Input
        label="Full title (English)"
        required
        value={data.s1_title_en || ''}
        onChange={(e) => update({ s1_title_en: e.target.value })}
        helper='Copy exactly as it appears on the cover or header — do not paraphrase'
        placeholder="e.g. Household Income and Expenditure Survey Report 2022"
      />

      {/* Title MS */}
      <Input
        label="Title (Bahasa Malaysia)"
        value={data.s1_title_ms || ''}
        onChange={(e) => update({ s1_title_ms: e.target.value })}
        helper="Leave blank if not provided"
        placeholder="e.g. Laporan Kajian Pendapatan dan Perbelanjaan Isi Rumah 2022"
      />

      {/* Source authority */}
      <Select
        label="Who published this?"
        required
        value={data.s1_source_authority || ''}
        onChange={(e) => update({ s1_source_authority: e.target.value })}
        options={[
          { value: '', label: 'Select publisher…' },
          ...LAYER0_SOURCE_AUTHORITIES.map((a) => ({ value: a, label: a })),
        ]}
      />

      {/* Doc type */}
      <Select
        label="What kind of document is this?"
        required
        value={data.s1_doc_type || ''}
        onChange={(e) => update({ s1_doc_type: e.target.value })}
        options={[
          { value: '', label: 'Select document type…' },
          ...LAYER0_DOC_TYPES.map((t) => ({ value: t, label: t })),
        ]}
      />

      {/* Series / report code */}
      <Input
        label="Publication series or report code"
        value={data.s1_series || ''}
        onChange={(e) => update({ s1_series: e.target.value })}
        helper="E.g. HIES, CPI_MONTHLY, HANSARD-DR. Leave blank if this is a standalone document."
        placeholder="e.g. HIES"
      />

      {/* URL */}
      <div className="flex flex-col gap-1">
        <Input
          label="Direct URL to this document"
          required
          type="url"
          value={urlValue}
          onChange={(e) => update({ s1_url: e.target.value })}
          helper="Must link directly to the document — not a search results page or homepage"
          placeholder="https://www.dosm.gov.my/…"
          error={urlWarning}
        />
      </div>

      {/* Published date */}
      <Input
        label="Publication date"
        required
        type="date"
        value={data.s1_published_date || ''}
        onChange={(e) => update({ s1_published_date: e.target.value })}
      />

      {/* Reference period */}
      <div>
        <p className="text-xs font-medium text-text-primary mb-1">
          What period does this document cover?
        </p>
        <p className="text-2xs text-text-secondary mb-2">
          Leave blank if this is not a statistical or time-series document
        </p>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="From"
              type="date"
              value={data.s1_ref_period_start || ''}
              onChange={(e) => update({ s1_ref_period_start: e.target.value || null })}
            />
          </div>
          <div className="flex-1">
            <Input
              label="To"
              type="date"
              value={data.s1_ref_period_end || ''}
              onChange={(e) => update({ s1_ref_period_end: e.target.value || null })}
            />
          </div>
        </div>
      </div>

      {/* Language */}
      <div>
        <p className="text-xs font-medium text-text-primary mb-1">
          Language <span className="text-danger">*</span>
        </p>
        <div className="flex gap-2">
          {LANGUAGE_OPTIONS.map((opt) => {
            const currentKey = selectedLanguageKey()
            const active = currentKey === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleLanguage(opt.value)}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors focus-ring ${
                  active
                    ? 'bg-primary text-white border-primary'
                    : 'bg-bg-subtle text-text-secondary border-border hover:bg-bg-subtle hover:text-text-primary'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
