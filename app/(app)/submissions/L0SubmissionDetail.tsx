import { Badge } from '@/components/ui/Badge'
import type { Layer0Submission, SubmissionStatus, IngestionStatus } from '@/lib/types'

interface Props { submission: Layer0Submission }

function Row({ label, value }: {
  label: string
  value: string | number | boolean | string[] | null | undefined
}) {
  if (value === null || value === undefined || value === '') return null
  if (Array.isArray(value) && value.length === 0) return null
  const display = Array.isArray(value) ? value.join(', ') : String(value)
  return (
    <div className="py-2 border-b border-border last:border-0">
      <p className="text-2xs text-text-secondary mb-0.5">{label}</p>
      <p className="text-xs text-text-primary">{display}</p>
    </div>
  )
}

function IngestionPill({ status }: { status: IngestionStatus | null | undefined }) {
  if (!status || status === 'not_started') return null
  const cfg: Record<IngestionStatus, { label: string; cls: string; pulse?: boolean }> = {
    not_started: { label: '', cls: '' },
    promoting: { label: 'Promoting…', cls: 'bg-cyan-100 text-cyan-700 border-cyan-200', pulse: true },
    chunking: { label: 'Chunking…', cls: 'bg-cyan-100 text-cyan-700 border-cyan-200', pulse: true },
    complete: { label: 'Indexed', cls: 'bg-green-100 text-success border-green-200' },
    failed: { label: 'Ingestion failed', cls: 'bg-red-100 text-danger border-red-200' },
  }
  const c = cfg[status]
  if (!c.label) return null
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-2xs font-medium ${c.cls}`}>
      {c.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {c.label}
    </span>
  )
}

export function L0SubmissionDetail({ submission: s }: Props) {
  return (
    <div className="flex flex-col gap-4 text-xs">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={s.status as SubmissionStatus} />
        <span className="inline-flex px-2 py-0.5 rounded-full bg-accent/10 text-accent text-2xs font-medium border border-accent/20">
          Layer 0
        </span>
        <IngestionPill status={s.ingestion_status} />
        {s.reviewed_at && (
          <span className="text-2xs text-text-disabled">Reviewed {s.reviewed_at.slice(0, 10)}</span>
        )}
      </div>

      {s.review_note && (
        <div className={`rounded p-3 text-xs ${
          s.status === 'rejected'
            ? 'bg-red-50 border border-red-200'
            : 'bg-purple-50 border border-purple-200'
        }`}>
          <p className="font-medium mb-1">
            {s.status === 'rejected' ? 'Rejection reason' : 'Review note'}
          </p>
          <p>{s.review_note}</p>
        </div>
      )}

      <section>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Identity</h3>
        <Row label="Title (English)" value={s.s1_title_en} />
        <Row label="Title (Bahasa Malaysia)" value={s.s1_title_ms} />
        <Row label="Publisher" value={s.s1_source_authority} />
        <Row label="Document type" value={s.s1_doc_type} />
        <Row label="Series / code" value={s.s1_series} />
        <Row label="URL" value={s.s1_url} />
        <Row label="Published" value={s.s1_published_date} />
        <Row
          label="Reference period"
          value={
            s.s1_ref_period_start
              ? `${s.s1_ref_period_start}${s.s1_ref_period_end ? ` → ${s.s1_ref_period_end}` : ''}`
              : null
          }
        />
        <Row label="Language" value={s.s1_language} />
      </section>

      <section>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Document Details</h3>
        <Row label="Summary (English)" value={s.s2_summary_en} />
        <Row label="Summary (BM)" value={s.s2_summary_ms} />
        <Row label="Document status" value={s.s2_doc_status} />
        <Row
          label="Updates previous edition"
          value={
            s.s2_updates_previous
              ? `Yes — ${s.s2_updates_which || '(not specified)'}`
              : 'No'
          }
        />
        <Row label="Topics" value={s.s2_topics} />
        <Row label="Geography" value={s.s2_geography} />
      </section>

      <div className="flex flex-col gap-1 pt-2 border-t border-border">
        <div className="flex justify-between">
          <span className="text-2xs text-text-disabled">Porter</span>
          <span className="text-2xs text-text-secondary">{s.porter_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-2xs text-text-disabled">Submitted</span>
          <span className="mono text-2xs text-text-secondary">{s.submitted_at?.slice(0, 10)}</span>
        </div>
        {s.promoted_doc_id && (
          <div className="flex justify-between">
            <span className="text-2xs text-text-disabled">Doc ID</span>
            <span className="mono text-2xs text-text-secondary">{s.promoted_doc_id}</span>
          </div>
        )}
      </div>
    </div>
  )
}
