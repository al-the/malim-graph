import type { ChunkNode } from '@/lib/types'

const CHUNK_TOKENS = 500
const OVERLAP_TOKENS = 50
// Approximate: 1 token ≈ 4 chars for English/Malay prose
const CHARS_PER_TOKEN = 4

export interface RawChunk {
  text: string
  token_count: number
  chunk_index: number
  page_ref: number | null
  section_heading: string | null
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

/**
 * Split text into sentences, respecting boundaries.
 */
function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace or end of string
  return text
    .split(/(?<=[.!?。])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Detect a section heading from a line (ALL CAPS or Title Case starting a paragraph).
 */
function detectSectionHeading(text: string): string | null {
  const firstLine = text.split('\n')[0].trim()
  if (firstLine.length < 100 && /^[A-Z][^a-z]{3,}/.test(firstLine)) {
    return firstLine
  }
  return null
}

/**
 * Sliding window chunker.
 * ~500 tokens per chunk, 50-token overlap, respects sentence boundaries.
 */
export function chunkText(fullText: string): RawChunk[] {
  const sentences = splitSentences(fullText)
  const chunks: RawChunk[] = []

  let buffer: string[] = []
  let bufferTokens = 0
  let chunkIndex = 1
  let currentHeading: string | null = null

  function flush(isOverlap = false) {
    if (buffer.length === 0) return
    const text = buffer.join(' ').trim()
    if (!text) return

    const heading = detectSectionHeading(text) ?? currentHeading
    chunks.push({
      text,
      token_count: estimateTokens(text),
      chunk_index: chunkIndex++,
      page_ref: null,
      section_heading: heading,
    })

    if (isOverlap) {
      // Keep last OVERLAP_TOKENS worth of sentences for next chunk
      let overlapTokens = 0
      const overlapSentences: string[] = []
      for (let i = buffer.length - 1; i >= 0; i--) {
        const t = estimateTokens(buffer[i])
        if (overlapTokens + t > OVERLAP_TOKENS) break
        overlapTokens += t
        overlapSentences.unshift(buffer[i])
      }
      buffer = overlapSentences
      bufferTokens = overlapTokens
    } else {
      buffer = []
      bufferTokens = 0
    }
  }

  for (const sentence of sentences) {
    const sentTokens = estimateTokens(sentence)

    // Detect new section heading
    const heading = detectSectionHeading(sentence)
    if (heading) currentHeading = heading

    if (bufferTokens + sentTokens > CHUNK_TOKENS && buffer.length > 0) {
      flush(true)
    }

    buffer.push(sentence)
    bufferTokens += sentTokens
  }

  if (buffer.length > 0) flush(false)

  return chunks
}

/**
 * Build ChunkNode objects from raw chunks.
 */
export function buildChunkNodes(
  rawChunks: RawChunk[],
  docId: string,
  sourceAuthority: string,
  series: string,
  publishedDate: string,
): Omit<ChunkNode, 'id'>[] {
  const safeSource = sourceAuthority.toLowerCase().replace(/\s+/g, '_').slice(0, 12)
  const safeSeries = series.toLowerCase().replace(/\s+/g, '_').slice(0, 12) || 'doc'
  const safeDate = publishedDate.slice(0, 10).replace(/-/g, '')

  return rawChunks.map((rc) => ({
    doc_id: docId,
    node_type: 'Chunk' as const,
    layer: 0 as const,
    schema_version: '1.0',
    chunk_id: `chunk:${safeSource}:${safeSeries}:${safeDate}:${String(rc.chunk_index).padStart(3, '0')}`,
    text: rc.text,
    token_count: rc.token_count,
    language: detectLanguage(rc.text),
    page_ref: rc.page_ref,
    chunk_index: rc.chunk_index,
    section_heading: rc.section_heading,
    claims_extracted: [],
    ingested_at: new Date().toISOString(),
    source_doc_id: docId,
  }))
}

function detectLanguage(text: string): 'en' | 'ms' | 'mixed' {
  // Simple heuristic: check for common Malay words
  const msWords = /\b(dan|yang|dengan|untuk|atau|ini|itu|pada|dalam|kepada|oleh)\b/gi
  const enWords = /\b(the|and|with|for|or|this|that|in|of|to|by)\b/gi
  const msCount = (text.match(msWords) || []).length
  const enCount = (text.match(enWords) || []).length
  if (msCount > 0 && enCount > 0) return 'mixed'
  if (msCount > enCount) return 'ms'
  return 'en'
}
