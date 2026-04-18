import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { containers } from '@/lib/cosmos'
import { appendAuditLog } from '@/lib/audit'
import bcrypt from 'bcryptjs'
import type { User } from '@/lib/types'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { resources } = await containers
      .users()
      .items.query<User>({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: params.id }] })
      .fetchAll()

    const user = resources[0]
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updates: Partial<User> = {
      name: body.name ?? user.name,
      role: body.role ?? user.role,
      porter_id: body.porter_id !== undefined ? body.porter_id : user.porter_id,
      status: body.status ?? user.status,
    }

    if (body.password) {
      updates.password = await bcrypt.hash(body.password, 12)
    }

    const updated: User = { ...user, ...updates }
    await containers.users().item(user.id, user.role).replace(updated)

    await appendAuditLog({
      action: 'user.update',
      performed_by: session.user.id,
      performed_by_name: session.user.name,
      target_id: user.id,
      target_type: 'user',
      diff: { ...body, password: body.password ? '[changed]' : undefined },
    })

    return NextResponse.json({ user: { ...updated, password: undefined } })
  } catch {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
