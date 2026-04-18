import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { containers } from '@/lib/cosmos'
import { appendAuditLog } from '@/lib/audit'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import type { User } from '@/lib/types'

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { resources } = await containers
      .users()
      .items.query<User>('SELECT * FROM c ORDER BY c.created_at DESC')
      .fetchAll()
    return NextResponse.json({ users: resources.map((u) => ({ ...u, password: undefined })) })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { email, password, name, role, porter_id, status } = body

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check for duplicate email
    const { resources: existing } = await containers
      .users()
      .items.query({ query: 'SELECT c.id FROM c WHERE c.email = @email', parameters: [{ name: '@email', value: email }] })
      .fetchAll()
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const now = new Date().toISOString()
    const user: User = {
      id: uuidv4(),
      email,
      password: hashed,
      name,
      role,
      porter_id: porter_id || null,
      status: status || 'active',
      created_at: now,
      last_login: null,
    }

    await containers.users().items.create(user)
    await appendAuditLog({
      action: 'user.create',
      performed_by: session.user.id,
      performed_by_name: session.user.name,
      target_id: user.id,
      target_type: 'user',
      diff: { email, name, role },
    })

    return NextResponse.json({ user: { ...user, password: undefined } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
