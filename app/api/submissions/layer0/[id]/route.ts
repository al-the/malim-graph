import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { containers } from '@/lib/cosmos'
import { appendAuditLog } from '@/lib/audit'
import { promoteToDocumentNode, generateChunks } from '@/lib/ingestion/layer0'
import type { Layer0Submission } from '@/lib/types'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { resources } = await containers
      .submissions()
      .items.query<Layer0Submission>({
        query: 'SELECT * FROM c WHERE c.id = @id AND c.layer = 0',
        parameters: [{ name: '@id', value: params.id }],
      })
      .fetchAll()

    const sub = resources[0]
    if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (session.user.role === 'porter' && sub.porter_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ submission: sub })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()

    const { resources } = await containers
      .submissions()
      .items.query<Layer0Submission>({
        query: 'SELECT * FROM c WHERE c.id = @id AND c.layer = 0',
        parameters: [{ name: '@id', value: params.id }],
      })
      .fetchAll()

    const sub = resources[0]
    if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (session.user.role === 'porter') {
      if (sub.porter_id !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (sub.status !== 'pending') {
        return NextResponse.json({ error: 'Cannot edit non-pending submission' }, { status: 400 })
      }
    }

    const now = new Date().toISOString()
    const isSupervisorAction =
      (session.user.role === 'supervisor' || session.user.role === 'admin') && body.status

    const updated: Layer0Submission = {
      ...sub,
      ...body,
      updated_at: now,
      ...(isSupervisorAction
        ? { reviewed_by: session.user.id, reviewed_at: now }
        : {}),
    }

    await containers.submissions().items.upsert(updated)
    await appendAuditLog({
      action: 'submission.layer0.update',
      performed_by: session.user.id,
      performed_by_name: session.user.name,
      target_id: sub.id,
      target_type: 'layer0_submission',
      diff: body,
    })

    // Trigger ingestion pipeline on approval (fire-and-forget, never crash approval)
    if (isSupervisorAction && body.status === 'approved') {
      const ingestionUpdated: Layer0Submission = {
        ...updated,
        ingestion_status: 'promoting',
      }
      await containers.submissions().items.upsert(ingestionUpdated).catch(console.error)

      // Run async — do not await
      void (async () => {
        try {
          const doc = await promoteToDocumentNode(
            ingestionUpdated,
            session.user.id,
            session.user.name,
          )
          await generateChunks(
            doc.doc_id,
            sub.s1_url,
            sub.id,
            sub.s1_source_authority,
            sub.s1_series,
            sub.s1_published_date,
            session.user.id,
            session.user.name,
          )
        } catch (err) {
          console.error('Ingestion pipeline failed for submission', sub.id, err)
          const failedSub: Layer0Submission = {
            ...ingestionUpdated,
            ingestion_status: 'failed',
          }
          await containers.submissions().items.upsert(failedSub).catch(console.error)
        }
      })()
    }

    return NextResponse.json({ submission: updated })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
  }
}
