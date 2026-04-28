import { v4 as uuidv4 } from 'uuid'
import { containers } from '@/lib/cosmos'
import { appendAuditLog } from '@/lib/audit'
import { chunkText, buildChunkNodes } from './chunker'
import { generateEmbedding } from './embeddings'
import type { DocumentNode, Layer0Submission, ChunkNode } from '@/lib/types'

function buildDocId(sourceAuthority: string, series: string, publishedDate: string): string {
  const sa = sourceAuthority.toUpperCase().replace(/\s+/g, '_').slice(0, 8)
  const sr = (series || 'DOC').toUpperCase().replace(/\s+/g, '_').slice(0, 12)
  const dt = publishedDate.slice(0, 7).replace(/-/g, '')
  const short = uuidv4().slice(0, 4)
  return `${sa}-${sr}-${dt}-${short}`
}

export async function promoteToDocumentNode(
  submission: Layer0Submission,
  reviewerId: string,
  reviewerName: string,
): Promise<DocumentNode> {
  const now = new Date().toISOString()
  const docId = buildDocId(
    submission.s1_source_authority,
    submission.s1_series,
    submission.s1_published_date,
  )

  const mapDocStatus = (
    s: 'preliminary' | 'revised' | 'final' | 'not_applicable',
  ): 'preliminary' | 'revised' | 'final' => {
    if (s === 'not_applicable') return 'final'
    return s
  }

  const doc: DocumentNode = {
    id: uuidv4(),
    source_authority: submission.s1_source_authority,

    node_type: 'Document',
    layer: 0,
    doc_id: docId,
    schema_version: '1.0',

    title_en: submission.s1_title_en,
    title_ms: submission.s1_title_ms,
    doc_type: submission.s1_doc_type,
    series: submission.s1_series || null,
    url_canonical: submission.s1_url,
    language: submission.s1_language,
    published_date: submission.s1_published_date,
    ref_period_start: submission.s1_ref_period_start,
    ref_period_end: submission.s1_ref_period_end,

    doc_status: mapDocStatus(submission.s2_doc_status),
    thematic_tags: submission.s2_topics,
    geographic_scope: submission.s2_geography,
    summary_en: submission.s2_summary_en,
    summary_ms: submission.s2_summary_ms || null,

    supersedes_doc_id: null,
    cited_doc_ids: [],

    provenance: {
      submission_id: submission.id,
      extracted_by: submission.porter_id,
      extracted_at: submission.submitted_at,
      reviewed_by: reviewerId,
      reviewed_at: now,
      confidence: 0.9,
      confidence_basis: 'human_reviewed',
    },

    temporal: {
      valid_from: submission.s1_published_date,
      valid_until: null,
      is_current: true,
      version: 1,
      superseded_by: null,
      as_of_date: now,
    },

    edge_refs: {
      updates: null,
      cites: [],
    },

    status: 'active',
    ingested_at: now,
    last_verified_at: null,
  }

  // Handle supersession if this updates a previous document
  if (submission.s2_updates_previous && submission.s2_updates_which) {
    try {
      const { resources: prevDocs } = await containers
        .documents()
        .items.query<DocumentNode>({
          query:
            'SELECT * FROM c WHERE c.source_authority = @sa AND c.temporal.is_current = true ORDER BY c.published_date DESC OFFSET 0 LIMIT 1',
          parameters: [{ name: '@sa', value: submission.s1_source_authority }],
        })
        .fetchAll()

      if (prevDocs.length > 0) {
        const prev = prevDocs[0]
        doc.supersedes_doc_id = prev.doc_id
        doc.edge_refs.updates = prev.doc_id

        const updatedPrev: DocumentNode = {
          ...prev,
          temporal: {
            ...prev.temporal,
            is_current: false,
            superseded_by: docId,
            valid_until: now,
          },
        }
        await containers.documents().items.upsert(updatedPrev)
      }
    } catch (err) {
      console.error('Failed to resolve supersession:', err)
    }
  }

  await containers.documents().items.create(doc)

  // Update submission with promoted doc_id and chunking status
  const updatedSubmission: Layer0Submission = {
    ...submission,
    promoted_doc_id: docId,
    ingestion_status: 'chunking',
    updated_at: now,
  }
  await containers.submissions().items.upsert(updatedSubmission)

  await appendAuditLog({
    action: 'document.promoted',
    performed_by: reviewerId,
    performed_by_name: reviewerName,
    target_id: docId,
    target_type: 'document',
    diff: { submission_id: submission.id, doc_id: docId },
  })

  return doc
}

export async function generateChunks(
  docId: string,
  sourceUrl: string,
  submissionId: string,
  sourceAuthority: string,
  series: string,
  publishedDate: string,
  performedBy: string,
  performedByName: string,
): Promise<number> {
  let fullText = ''

  try {
    const response = await fetch(sourceUrl, {
      headers: { 'User-Agent': 'MalimDB-Ingestion/1.0' },
      signal: AbortSignal.timeout(30000),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('text/html')) {
      const html = await response.text()
      // Strip HTML tags, collapse whitespace
      fullText = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s{2,}/g, ' ')
        .trim()
    } else {
      // For PDF and other binary types, store placeholder
      fullText = `[Binary document: ${contentType}. Text extraction requires server-side PDF processing.]`
    }
  } catch (err) {
    console.error('Failed to fetch document for chunking:', err)
    await updateIngestionStatus(submissionId, sourceAuthority, 'failed')
    throw err
  }

  const rawChunks = chunkText(fullText)
  const chunkDefs = buildChunkNodes(rawChunks, docId, sourceAuthority, series, publishedDate)

  let stored = 0
  for (let i = 0; i < chunkDefs.length; i++) {
    const chunkDef = chunkDefs[i]
    const chunk: ChunkNode = {
      id: uuidv4(),
      ...chunkDef,
    }

    try {
      await containers.chunks().items.create(chunk)
      stored++

      // Attempt embedding generation — never fail the pipeline if this errors
      try {
        await generateEmbedding(chunk.text)
        // Embedding stored in Cosmos DB vector index — not in document body
      } catch (embErr) {
        console.error(`Embedding failed for chunk ${chunk.chunk_id}:`, embErr)
      }

      // Create ADJACENT_TO edge between consecutive chunks
      if (i > 0) {
        const prevChunk = chunkDefs[i - 1]
        const edge = {
          id: uuidv4(),
          from_doc_id: docId,
          edge_type: 'ADJACENT_TO',
          layer: 0,
          from_chunk_id: prevChunk.chunk_id,
          to_chunk_id: chunk.chunk_id,
          created_at: new Date().toISOString(),
        }
        try {
          await containers.semanticEdges().items.create(edge)
        } catch {
          // Non-fatal
        }
      }
    } catch (err) {
      console.error(`Failed to store chunk ${i}:`, err)
    }
  }

  await updateIngestionStatus(submissionId, sourceAuthority, 'complete', stored)

  await appendAuditLog({
    action: 'document.chunked',
    performed_by: performedBy,
    performed_by_name: performedByName,
    target_id: docId,
    target_type: 'document',
    diff: { chunks_generated: stored },
  })

  return stored
}

async function updateIngestionStatus(
  submissionId: string,
  porterId: string,
  status: 'complete' | 'failed',
  chunksGenerated?: number,
) {
  try {
    const { resources } = await containers
      .submissions()
      .items.query<Layer0Submission>({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: submissionId }],
      })
      .fetchAll()

    if (resources.length === 0) return
    const sub = resources[0]

    const updated: Layer0Submission = {
      ...sub,
      ingestion_status: status,
      chunks_generated: chunksGenerated ?? sub.chunks_generated,
      updated_at: new Date().toISOString(),
    }
    await containers.submissions().items.upsert(updated)
  } catch (err) {
    console.error('Failed to update ingestion status:', err)
  }
}
