import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { containers } from '@/lib/cosmos'
import { appendAuditLog } from '@/lib/audit'
import type { Submission } from '@/lib/types'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const query = {
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: params.id }],
    }
    const { resources } = await containers.submissions().items.query<Submission>(query).fetchAll()
    const sub = resources[0]
    if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (session.user.role === 'porter' && sub.porter_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ submission: sub })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const query = {
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: params.id }],
    }
    const { resources } = await containers.submissions().items.query<Submission>(query).fetchAll()
    const sub = resources[0]
    if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Porters can only edit their own pending submissions
    if (session.user.role === 'porter') {
      if (sub.porter_id !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      if (sub.status !== 'pending') return NextResponse.json({ error: 'Cannot edit non-pending submission' }, { status: 400 })
    }

    const isSupervisorAction = (session.user.role === 'supervisor' || session.user.role === 'admin') && body.status
    const updated: Submission = {
      ...sub,
      ...body,
      updated_at: new Date().toISOString(),
      ...(isSupervisorAction ? { reviewed_by: session.user.id, review_status: body.status } : {}),
    }

    await containers.submissions().items.upsert(updated)
    await appendAuditLog({
      action: 'submission.update',
      performed_by: session.user.id,
      performed_by_name: session.user.name,
      target_id: sub.id,
      target_type: 'submission',
      diff: body,
    })

    return NextResponse.json({ submission: updated })
  } catch {
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
  }
}
