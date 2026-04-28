import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { containers } from '@/lib/cosmos'
import type { DocumentNode } from '@/lib/types'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const sourceAuthority = searchParams.get('source_authority')
  const docType = searchParams.get('doc_type')
  const topic = searchParams.get('topic')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  try {
    let query = 'SELECT * FROM c WHERE c.node_type = @nodeType'
    const params: { name: string; value: string | number }[] = [
      { name: '@nodeType', value: 'Document' },
    ]

    if (sourceAuthority) {
      query += ' AND c.source_authority = @sa'
      params.push({ name: '@sa', value: sourceAuthority })
    }
    if (docType) {
      query += ' AND c.doc_type = @docType'
      params.push({ name: '@docType', value: docType })
    }
    if (topic) {
      query += ' AND ARRAY_CONTAINS(c.thematic_tags, @topic)'
      params.push({ name: '@topic', value: topic })
    }
    if (search) {
      query += ' AND CONTAINS(LOWER(c.title_en), @search)'
      params.push({ name: '@search', value: search.toLowerCase() })
    }

    query += ' ORDER BY c.ingested_at DESC OFFSET @offset LIMIT @limit'
    params.push({ name: '@offset', value: offset })
    params.push({ name: '@limit', value: limit })

    const { resources } = await containers
      .documents()
      .items.query<DocumentNode>({ query, parameters: params })
      .fetchAll()

    // Get chunk counts for each document
    const docsWithCounts = await Promise.all(
      resources.map(async (doc) => {
        try {
          const { resources: countRes } = await containers
            .chunks()
            .items.query<{ count: number }>({
              query: 'SELECT VALUE COUNT(1) FROM c WHERE c.doc_id = @docId',
              parameters: [{ name: '@docId', value: doc.doc_id }],
            })
            .fetchAll()
          return { ...doc, chunk_count: countRes[0] ?? 0 }
        } catch {
          return { ...doc, chunk_count: 0 }
        }
      }),
    )

    return NextResponse.json({ documents: docsWithCounts, page, limit })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}
