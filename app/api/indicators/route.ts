import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { containers } from '@/lib/cosmos'
import { appendAuditLog } from '@/lib/audit'
import { v4 as uuidv4 } from 'uuid'
import type { Indicator } from '@/lib/types'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const showDeprecated = searchParams.get('deprecated') === 'true'
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''

  try {
    let query = 'SELECT * FROM c WHERE 1=1'
    const params: { name: string; value: string }[] = []

    if (!showDeprecated) {
      query += " AND c.status = 'active'"
    }
    if (category) {
      query += ' AND c.category = @category'
      params.push({ name: '@category', value: category })
    }
    if (search) {
      query += ' AND (CONTAINS(LOWER(c.canonical_name), @search) OR CONTAINS(LOWER(c.indicator_id), @search))'
      params.push({ name: '@search', value: search.toLowerCase() })
    }
    query += ' ORDER BY c.canonical_name'

    const { resources } = await containers
      .indicators()
      .items.query<Indicator>({ query, parameters: params })
      .fetchAll()

    return NextResponse.json({ indicators: resources })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch indicators' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const now = new Date().toISOString()
    const indicator: Indicator = {
      id: uuidv4(),
      indicator_id: body.indicator_id,
      canonical_name: body.canonical_name,
      canonical_name_ms: body.canonical_name_ms || '',
      authority: body.authority,
      series_code: body.series_code || '',
      category: body.category,
      unit: body.unit,
      base_year: body.base_year || '',
      frequency: body.frequency,
      methodology_reference: body.methodology_reference || '',
      sdg_alignment: body.sdg_alignment || [],
      notes: body.notes || '',
      status: 'active',
      created_at: now,
      updated_at: now,
    }

    await containers.indicators().items.create(indicator)
    await appendAuditLog({
      action: 'indicator.create',
      performed_by: session.user.id,
      performed_by_name: session.user.name,
      target_id: indicator.id,
      target_type: 'indicator',
      diff: body,
    })

    return NextResponse.json({ indicator }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create indicator' }, { status: 500 })
  }
}
