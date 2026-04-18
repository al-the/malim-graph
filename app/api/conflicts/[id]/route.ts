import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { containers } from '@/lib/cosmos'
import { appendAuditLog } from '@/lib/audit'
import type { Submission } from '@/lib/types'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { resources } = await containers
      .submissions()
      .items.query<Submission>({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: params.id }],
      })
      .fetchAll()

    const sub = resources[0]
    if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated: Submission = {
      ...sub,
      conflict_resolved: true,
      conflict_resolution_strategy: body.strategy,
      conflict_resolution_note: body.note,
      conflict_resolved_by: session.user.id,
      conflict_resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await containers.submissions().item(sub.id, sub.porter_id).replace(updated)
    await appendAuditLog({
      action: 'conflict.resolve',
      performed_by: session.user.id,
      performed_by_name: session.user.name,
      target_id: sub.id,
      target_type: 'submission',
      diff: { strategy: body.strategy, note: body.note },
    })

    return NextResponse.json({ submission: updated })
  } catch {
    return NextResponse.json({ error: 'Failed to resolve conflict' }, { status: 500 })
  }
}
