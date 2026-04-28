'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { DocumentDrawer } from './DocumentDrawer'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { DocumentNode } from '@/lib/types'
import { LAYER0_SOURCE_AUTHORITIES, LAYER0_DOC_TYPES } from '@/lib/types'

interface DocumentWithCount extends DocumentNode {
  chunk_count: number
}

interface DocsResponse {
  documents: DocumentWithCount[]
  page: number
  limit: number
}

export function DocumentLibrary({ role }: { role: string }) {
  const [docs, setDocs] = useState<DocumentWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<DocumentWithCount | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  // Filters
  const [sourceAuthority, setSourceAuthority] = useState('')
  const [docType, setDocType] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async (p: number, filters: {
    sourceAuthority: string
    docType: string
    search: string
  }) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' })
      if (filters.sourceAuthority) params.set('source_authority', filters.sourceAuthority)
      if (filters.docType) params.set('doc_type', filters.docType)
      if (filters.search) params.set('search', filters.search)

      const res = await fetch(`/api/documents?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json() as DocsResponse
      setDocs(data.documents)
      setHasMore(data.documents.length === 20)
      setPage(p)
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Count total separately (best effort)
    fetch('/api/documents?page=1&limit=1')
      .then((r) => r.json())
      .then((d: DocsResponse) => {
        // We can't get exact total without a count query, show rough indicator
        if (d.documents) setTotalCount(d.documents.length)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      load(1, { sourceAuthority, docType, search })
    }, 300)
    return () => clearTimeout(timer)
  }, [load, sourceAuthority, docType, search])

  const isPorter = role === 'porter'

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select
          value={sourceAuthority}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSourceAuthority(e.target.value)}
          options={[
            { value: '', label: 'All sources' },
            ...LAYER0_SOURCE_AUTHORITIES.map((a) => ({ value: a, label: a })),
          ]}
        />
        <Select
          value={docType}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDocType(e.target.value)}
          options={[
            { value: '', label: 'All types' },
            ...LAYER0_DOC_TYPES.map((t) => ({ value: t, label: t })),
          ]}
        />
        <input
          type="search"
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 px-3 rounded border border-border bg-bg-subtle text-xs text-text-primary placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 min-w-[200px]"
        />
        <div className="ml-auto">
          <span className="text-2xs text-text-disabled">{docs.length} documents</span>
        </div>
      </div>

      <div className="bg-bg-surface border border-border rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Source</th>
                <th>Type</th>
                <th>Published</th>
                <th>Period</th>
                <th>Status</th>
                <th>Chunks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTable rows={8} cols={8} />
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-0">
                    <EmptyState
                      message="No documents indexed yet"
                      description={
                        isPorter
                          ? 'Submit the first document to get started.'
                          : 'Approve a Layer 0 submission to index the first document.'
                      }
                      action={
                        isPorter ? (
                          <Link
                            href="/submissions/new"
                            className="inline-flex items-center px-3 h-8 bg-primary text-white text-xs font-medium rounded hover:bg-primary-hover transition-colors focus-ring"
                          >
                            Submit a document
                          </Link>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                docs.map((doc) => (
                  <tr key={doc.id}>
                    <td
                      className="max-w-[200px] truncate font-medium"
                      title={doc.title_en}
                    >
                      {doc.title_en}
                    </td>
                    <td className="text-text-secondary whitespace-nowrap">{doc.source_authority}</td>
                    <td className="text-text-secondary whitespace-nowrap">{doc.doc_type}</td>
                    <td className="mono text-text-secondary whitespace-nowrap">{doc.published_date}</td>
                    <td className="mono text-text-secondary whitespace-nowrap">
                      {doc.ref_period_start ? `${doc.ref_period_start.slice(0, 7)}…` : '—'}
                    </td>
                    <td>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-medium border ${
                        doc.status === 'active'
                          ? 'bg-green-50 text-success border-green-200'
                          : 'bg-bg-subtle text-text-secondary border-border'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="mono text-text-secondary">{doc.chunk_count}</td>
                    <td>
                      <Button size="sm" variant="ghost" onClick={() => setSelected(doc)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(page > 1 || hasMore) && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-border">
            <Button
              size="sm"
              variant="ghost"
              disabled={page <= 1}
              onClick={() => load(page - 1, { sourceAuthority, docType, search })}
            >
              Previous
            </Button>
            <span className="text-2xs text-text-disabled">Page {page}</span>
            <Button
              size="sm"
              variant="ghost"
              disabled={!hasMore}
              onClick={() => load(page + 1, { sourceAuthority, docType, search })}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <DocumentDrawer doc={selected} onClose={() => setSelected(null)} />
    </>
  )
}
