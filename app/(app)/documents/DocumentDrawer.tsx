'use client'

import { useEffect, useState, useCallback } from 'react'
import { Drawer } from '@/components/ui/Drawer'
import { Badge } from '@/components/ui/Badge'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import type { DocumentNode, ChunkNode, IngestionStatus } from '@/lib/types'

interface DocumentWithCount extends DocumentNode {
  chunk_count: number
}

interface ChunkResponse {
  chunks: ChunkNode[]
  total: number
  page: number
  limit: number
}

const CHUNKS_PER_PAGE = 20

function IngestionBadge({ status }: { status: IngestionStatus | null | undefined }) {
  if (!status || status === 'not_started') return null
  const map: Record<IngestionStatus, { label: string; cls: string; pulse?: boolean }> = {
    not_started: { label: '', cls: '' },
    promoting: { label: 'Promoting…', cls: 'bg-cyan-100 text-cyan-700 border-cyan-200', pulse: true },
    chunking: { label: 'Chunking…', cls: 'bg-cyan-100 text-cyan-700 border-cyan-200', pulse: true },
    complete: { label: 'Indexed', cls: 'bg-green-100 text-green-700 border-green-200' },
    failed: { label: 'Ingestion failed', cls: 'bg-red-100 text-danger border-red-200' },
  }
  const cfg = map[status]
  if (!cfg.label) return null
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-2xs font-medium ${cfg.cls}`}>
      {cfg.pulse && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {cfg.label}
    </span>
  )
}

function TagPills({ tags, cls }: { tags: string[]; cls?: string }) {
  if (!tags?.length) return <span className="text-text-disabled">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <span key={t} className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-medium ${cls || 'bg-primary/10 text-primary'}`}>
          {t}
        </span>
      ))}
    </div>
  )
}

function ChunksSection({ docId }: { docId: string }) {
  const [open, setOpen] = useState(false)
  const [chunks, setChunks] = useState<ChunkNode[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [expandedChunk, setExpandedChunk] = useState<string | null>(null)

  const loadChunks = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/documents/${docId}/chunks?page=${p}&limit=${CHUNKS_PER_PAGE}`)
      if (res.ok) {
        const data = await res.json() as ChunkResponse
        setChunks(data.chunks)
        setTotal(data.total)
        setPage(p)
      }
    } finally {
      setLoading(false)
    }
  }, [docId])

  function handleOpen() {
    setOpen(true)
    if (chunks.length === 0) loadChunks(1)
  }

  const totalPages = Math.ceil(total / CHUNKS_PER_PAGE)

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : handleOpen())}
        className="flex items-center gap-2 text-xs font-semibold text-text-primary hover:text-accent transition-colors focus-ring rounded"
      >
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Chunks ({total || '…'})
      </button>

      {open && (
        <div className="mt-3 border border-border rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Page</th>
                  <th>Section</th>
                  <th>Tokens</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonTable rows={5} cols={4} />
                ) : chunks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-text-disabled py-4 text-xs">
                      No chunks available
                    </td>
                  </tr>
                ) : (
                  chunks.map((c) => (
                    <>
                      <tr
                        key={c.id}
                        className="cursor-pointer hover:bg-bg-subtle"
                        onClick={() => setExpandedChunk(expandedChunk === c.id ? null : c.id)}
                      >
                        <td className="mono text-text-secondary">{c.chunk_index}</td>
                        <td className="text-text-secondary">{c.page_ref ?? '—'}</td>
                        <td className="max-w-[120px] truncate text-text-secondary" title={c.section_heading ?? ''}>
                          {c.section_heading || '—'}
                        </td>
                        <td className="mono text-text-secondary">{c.token_count}</td>
                      </tr>
                      {expandedChunk === c.id && (
                        <tr key={`${c.id}-preview`}>
                          <td colSpan={4} className="bg-bg-subtle px-3 py-2">
                            <p className="text-2xs text-text-secondary break-words whitespace-pre-wrap">
                              {c.text.slice(0, 200)}{c.text.length > 200 ? '…' : ''}
                            </p>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-border">
              <span className="text-2xs text-text-disabled">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => loadChunks(page - 1)}>
                  Prev
                </Button>
                <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => loadChunks(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface Props {
  doc: DocumentWithCount | null
  onClose: () => void
}

export function DocumentDrawer({ doc, onClose }: Props) {
  if (!doc) return null

  return (
    <Drawer open={!!doc} onClose={onClose} title={doc.title_en}>
      <div className="flex flex-col gap-4 text-xs">
        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex px-2 py-0.5 rounded-full bg-primary/10 text-primary text-2xs font-medium border border-primary/20">
            {doc.source_authority}
          </span>
          <span className="inline-flex px-2 py-0.5 rounded-full bg-accent/10 text-accent text-2xs font-medium border border-accent/20">
            {doc.doc_type}
          </span>
          <span className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-medium border ${
            doc.status === 'active'
              ? 'bg-green-50 text-success border-green-200'
              : 'bg-bg-subtle text-text-secondary border-border'
          }`}>
            {doc.status}
          </span>
        </div>

        {doc.title_ms && (
          <div>
            <dt className="text-2xs text-text-disabled uppercase tracking-wider mb-0.5">Title (BM)</dt>
            <dd className="text-text-primary">{doc.title_ms}</dd>
          </div>
        )}

        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-2xs text-text-disabled uppercase tracking-wider mb-0.5">Published</dt>
            <dd className="mono">{doc.published_date}</dd>
          </div>
          {doc.ref_period_start && (
            <div>
              <dt className="text-2xs text-text-disabled uppercase tracking-wider mb-0.5">Period</dt>
              <dd className="mono">
                {doc.ref_period_start}
                {doc.ref_period_end ? ` — ${doc.ref_period_end}` : ''}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-2xs text-text-disabled uppercase tracking-wider mb-0.5">Doc Status</dt>
            <dd className="capitalize">{doc.doc_status}</dd>
          </div>
          <div>
            <dt className="text-2xs text-text-disabled uppercase tracking-wider mb-0.5">Chunks</dt>
            <dd className="mono">{doc.chunk_count}</dd>
          </div>
        </dl>

        {/* URL */}
        <div>
          <dt className="text-2xs text-text-disabled uppercase tracking-wider mb-0.5">Document URL</dt>
          <dd>
            <a
              href={doc.url_canonical}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline break-all"
            >
              {doc.url_canonical}
            </a>
          </dd>
        </div>

        {/* Topics */}
        <div>
          <dt className="text-2xs text-text-disabled uppercase tracking-wider mb-1">Topics</dt>
          <TagPills tags={doc.thematic_tags} cls="bg-primary/10 text-primary" />
        </div>

        {/* Geography */}
        <div>
          <dt className="text-2xs text-text-disabled uppercase tracking-wider mb-1">Geography</dt>
          <TagPills tags={doc.geographic_scope} cls="bg-accent/10 text-accent" />
        </div>

        {/* Summaries */}
        {doc.summary_en && (
          <div>
            <dt className="text-2xs text-text-disabled uppercase tracking-wider mb-0.5">Summary (EN)</dt>
            <dd className="text-text-secondary">{doc.summary_en}</dd>
          </div>
        )}
        {doc.summary_ms && (
          <div>
            <dt className="text-2xs text-text-disabled uppercase tracking-wider mb-0.5">Summary (BM)</dt>
            <dd className="text-text-secondary">{doc.summary_ms}</dd>
          </div>
        )}

        {/* Supersedes */}
        {doc.supersedes_doc_id && (
          <div>
            <dt className="text-2xs text-text-disabled uppercase tracking-wider mb-0.5">Supersedes</dt>
            <dd className="mono text-text-secondary">{doc.supersedes_doc_id}</dd>
          </div>
        )}

        {/* Provenance */}
        <div className="border-t border-border pt-3">
          <p className="text-2xs text-text-disabled uppercase tracking-wider mb-2">Provenance</p>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-text-secondary">Submitted by</span>
              <span className="text-text-primary">{doc.provenance.extracted_by}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Submitted</span>
              <span className="mono">{doc.provenance.extracted_at.slice(0, 10)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Reviewed by</span>
              <span className="text-text-primary">{doc.provenance.reviewed_by}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Reviewed</span>
              <span className="mono">{doc.provenance.reviewed_at.slice(0, 10)}</span>
            </div>
          </div>
        </div>

        {/* Chunks section */}
        <ChunksSection docId={doc.doc_id} />
      </div>
    </Drawer>
  )
}
