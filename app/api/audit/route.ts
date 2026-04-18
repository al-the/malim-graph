import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { containers } from '@/lib/cosmos'
import type { AuditLog } from '@/lib/types'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 50
  const offset = (page - 1) * limit
  const action = searchParams.get('action') || ''
  const user = searchParams.get('user') || ''
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''

  try {
    let query = 'SELECT * FROM c WHERE 1=1'
    const params: { name: string; value: string }[] = []

    if (action) {
      query += ' AND CONTAINS(c.action, @action)'
      params.push({ name: '@action', value: action })
    }
    if (user) {
      query += ' AND CONTAINS(LOWER(c.performed_by_name), @user)'
      params.push({ name: '@user', value: user.toLowerCase() })
    }
    if (from) {
      query += ' AND c.timestamp >= @from'
      params.push({ name: '@from', value: from })
    }
    if (to) {
      query += ' AND c.timestamp <= @to'
      params.push({ name: '@to', value: to })
    }

    query += ` ORDER BY c.timestamp DESC OFFSET @offset LIMIT @limit`
    params.push({ name: '@offset', value: String(offset) })
    params.push({ name: '@limit', value: String(limit) })

    const { resources } = await containers
      .audit()
      .items.query<AuditLog>({ query, parameters: params })
      .fetchAll()

    return NextResponse.json({ logs: resources, page, limit })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 })
  }
}
