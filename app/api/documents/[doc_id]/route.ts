import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { containers } from '@/lib/cosmos'
import type { DocumentNode } from '@/lib/types'

export async function GET(
  _req: NextRequest,
  { params }: { params: { doc_id: string } },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { resources } = await containers
      .documents()
      .items.query<DocumentNode>({
        query: 'SELECT * FROM c WHERE c.doc_id = @docId',
        parameters: [{ name: '@docId', value: params.doc_id }],
      })
      .fetchAll()

    const doc = resources[0]
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Get chunk count
    const { resources: countRes } = await containers
      .chunks()
      .items.query<number>({
        query: 'SELECT VALUE COUNT(1) FROM c WHERE c.doc_id = @docId',
        parameters: [{ name: '@docId', value: params.doc_id }],
      })
      .fetchAll()

    return NextResponse.json({ document: { ...doc, chunk_count: countRes[0] ?? 0 } })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 })
  }
}
