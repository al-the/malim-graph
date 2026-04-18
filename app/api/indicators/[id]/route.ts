import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { containers } from '@/lib/cosmos'
import { appendAuditLog } from '@/lib/audit'
import type { Indicator } from '@/lib/types'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { resources } = await containers
      .indicators()
      .items.query<Indicator>({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: params.id }],
      })
      .fetchAll()

    const ind = resources[0]
    if (!ind) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated: Indicator = { ...ind, ...body, updated_at: new Date().toISOString() }
    await containers.indicators().item(ind.id, ind.category).replace(updated)

    await appendAuditLog({
      action: 'indicator.update',
      performed_by: session.user.id,
      performed_by_name: session.user.name,
      target_id: ind.id,
      target_type: 'indicator',
      diff: body,
    })

    return NextResponse.json({ indicator: updated })
  } catch {
    return NextResponse.json({ error: 'Failed to update indicator' }, { status: 500 })
  }
}
