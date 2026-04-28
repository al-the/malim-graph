import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { containers } from '@/lib/cosmos'
import type { ChunkNode } from '@/lib/types'

export async function GET(
  req: NextRequest,
  { params }: { params: { doc_id: string } },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  try {
    const { resources } = await containers
      .chunks()
      .items.query<ChunkNode>({
        query:
          'SELECT * FROM c WHERE c.doc_id = @docId ORDER BY c.chunk_index ASC OFFSET @offset LIMIT @limit',
        parameters: [
          { name: '@docId', value: params.doc_id },
          { name: '@offset', value: offset },
          { name: '@limit', value: limit },
        ],
      })
      .fetchAll()

    const { resources: countRes } = await containers
      .chunks()
      .items.query<number>({
        query: 'SELECT VALUE COUNT(1) FROM c WHERE c.doc_id = @docId',
        parameters: [{ name: '@docId', value: params.doc_id }],
      })
      .fetchAll()

    return NextResponse.json({ chunks: resources, total: countRes[0] ?? 0, page, limit })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch chunks' }, { status: 500 })
  }
}
