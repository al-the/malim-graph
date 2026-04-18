'use client'

import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { TagInput } from '@/components/ui/TagInput'
import { SOURCE_AUTHORITIES, DOC_TYPES } from '@/lib/types'
import type { FormData } from '../SubmissionForm'

interface Props { data: FormData; update: (p: Partial<FormData>) => void }

const LANGUAGES = ['English', 'Bahasa Malaysia', 'Both'] as const

export function Step1Identity({ data, update }: Props) {
  const get = (k: string) => (data[k] as string) || ''
  const langs = (data.s1_language as string[]) || []

  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-semibold text-text-primary">1. What is this document?</h2>
        <p className="text-2xs text-text-secondary mt-1">Start here. Identify the document so we never confuse it with another one.</p>
      </div>

      <Input
        label="Full title of the document (English)"
        required
        value={get('s1_title_en')}
        onChange={(e) => update({ s1_title_en: e.target.value })}
      />

      <Input
        label="Title in Bahasa Malaysia"
        value={get('s1_title_ms')}
        onChange={(e) => update({ s1_title_ms: e.target.value })}
        helper="Leave blank if not available"
      />

      <Select
        label="Who published this?"
        required
        value={get('s1_source_authority')}
        onChange={(e) => update({ s1_source_authority: e.target.value })}
        placeholder="Select publisher…"
        options={SOURCE_AUTHORITIES.map((a) => ({ value: a, label: a }))}
      />

      <Select
        label="What kind of document is this?"
        required
        value={get('s1_doc_type')}
        onChange={(e) => update({ s1_doc_type: e.target.value })}
        placeholder="Select document type…"
        options={DOC_TYPES.map((t) => ({ value: t, label: t }))}
      />

      <Input
        label="Document link"
        required
        type="url"
        value={get('s1_url')}
        onChange={(e) => update({ s1_url: e.target.value })}
        helper="Direct link to the file (PDF, Excel, etc.). If no file, type: No URL — uploaded"
        placeholder="e.g. https://storage.dosm.gov.my/mei/mei_2026-01.pdf"
      />

      <Input
        label="Source page"
        type="url"
        value={get('s1_source_url')}
        onChange={(e) => update({ s1_source_url: e.target.value })}
        helper="Link to the publication's landing page, if different from the document link"
        placeholder="e.g. https://open.dosm.gov.my/publications/mei_2026-01"
      />

      <Input
        label="When was this published?"
        required
        type="date"
        value={get('s1_published_date')}
        onChange={(e) => update({ s1_published_date: e.target.value })}
      />

      <div className="flex flex-col gap-1">
        <label className="text-2xs font-medium text-text-primary">What time period does this document cover?</label>
        <p className="text-2xs text-text-secondary">E.g. Jan 2022 – Dec 2022. Leave blank if not a statistical document.</p>
        <div className="flex gap-3 items-center">
          <Input
            type="date"
            value={get('s1_ref_period_start')}
            onChange={(e) => update({ s1_ref_period_start: e.target.value })}
            placeholder="From"
          />
          <span className="text-text-disabled flex-shrink-0">—</span>
          <Input
            type="date"
            value={get('s1_ref_period_end')}
            onChange={(e) => update({ s1_ref_period_end: e.target.value })}
            placeholder="To"
          />
        </div>
      </div>

      <TagInput
        label="What language is it in?"
        required
        options={LANGUAGES}
        value={langs}
        onChange={(v) => update({ s1_language: v })}
      />
    </div>
  )
}
