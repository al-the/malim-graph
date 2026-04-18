import { Badge } from '@/components/ui/Badge'
import type { Submission, SubmissionStatus } from '@/lib/types'

interface Props { submission: Submission }

function Row({ label, value }: { label: string; value: string | number | string[] | null | undefined }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null
  const display = Array.isArray(value) ? value.join(', ') : String(value)
  return (
    <div className="py-2 border-b border-border last:border-0">
      <p className="text-2xs text-text-secondary mb-0.5">{label}</p>
      <p className="text-xs text-text-primary">{display}</p>
    </div>
  )
}

export function SubmissionDetail({ submission: s }: Props) {
  return (
    <div className="flex flex-col gap-4 text-xs">
      <div className="flex items-center gap-2">
        <Badge variant={s.status as SubmissionStatus} />
        {s.reviewed_at && (
          <span className="text-2xs text-text-disabled">Reviewed {s.reviewed_at.slice(0, 10)}</span>
        )}
      </div>

      {s.review_note && (
        <div className={`rounded p-3 text-xs ${s.status === 'rejected' ? 'bg-red-50 border border-red-200' : 'bg-purple-50 border border-purple-200'}`}>
          <p className="font-medium mb-1">{s.status === 'rejected' ? 'Rejection reason' : 'Review note'}</p>
          <p>{s.review_note}</p>
        </div>
      )}

      <section>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Identity</h3>
        <Row label="Title (English)" value={s.s1_title_en} />
        <Row label="Title (Malay)" value={s.s1_title_ms} />
        <Row label="Source authority" value={s.s1_source_authority} />
        <Row label="Document type" value={s.s1_doc_type} />
        <Row label="Document link" value={s.s1_url} />
        <Row label="Source page" value={s.s1_source_url} />
        <Row label="Published" value={s.s1_published_date} />
        <Row label="Reference period" value={s.s1_ref_period_start ? `${s.s1_ref_period_start} → ${s.s1_ref_period_end}` : null} />
        <Row label="Language" value={s.s1_language} />
      </section>

      <section>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Content</h3>
        <Row label="Summary" value={s.s2_summary} />
        <Row label="Topics" value={s.s2_topics} />
        <Row label="Geography" value={s.s2_geography} />
        <Row label="Data status" value={s.s2_data_status} />
      </section>

      <section>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Reliability</h3>
        <Row label="Has methodology" value={s.s3_has_methodology} />
        <Row label="Data type" value={s.s3_data_type} />
        <Row label="Coverage gaps" value={s.s3_coverage_gaps} />
      </section>

      {s.s4_has_connections === 'yes' && (
        <section>
          <h3 className="text-sm font-semibold text-text-primary mb-2">Connections</h3>
          <Row label="Cited documents" value={s.s4_cited_docs} />
          <Row label="Updates previous" value={s.s4_updates_previous} />
          <Row label="Updates which" value={s.s4_updates_which} />
        </section>
      )}

      {s.s4_has_conflict === 'yes' && (
        <section className="bg-amber-50 border border-amber-200 rounded p-3">
          <h3 className="text-sm font-semibold text-warning mb-2">Data Conflict</h3>
          <Row label="Conflict source" value={s.s4_conflict_source} />
          <Row label="Conflict value" value={s.s4_conflict_value} />
          <Row label="Severity" value={s.s4_conflict_severity} />
        </section>
      )}

      <div className="flex flex-col gap-1 pt-2 border-t border-border">
        <div className="flex justify-between">
          <span className="text-2xs text-text-disabled">Porter</span>
          <span className="text-2xs text-text-secondary">{s.porter_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-2xs text-text-disabled">Submitted</span>
          <span className="mono text-2xs text-text-secondary">{s.submitted_at?.slice(0, 10)}</span>
        </div>
      </div>
    </div>
  )
}
