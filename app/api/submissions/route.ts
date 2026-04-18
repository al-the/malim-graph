import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { containers } from '@/lib/cosmos'
import { appendAuditLog } from '@/lib/audit'
import { v4 as uuidv4 } from 'uuid'
import type { Submission } from '@/lib/types'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  try {
    let query = 'SELECT * FROM c WHERE 1=1'
    const params: { name: string; value: unknown }[] = []

    if (session.user.role === 'porter') {
      query += ' AND c.porter_id = @porterId'
      params.push({ name: '@porterId', value: session.user.id })
    }
    if (status && status !== 'all') {
      query += ' AND c.status = @status'
      params.push({ name: '@status', value: status })
    }
    if (search) {
      query += ' AND CONTAINS(LOWER(c.s1_title_en), @search)'
      params.push({ name: '@search', value: search.toLowerCase() })
    }
    query += ' ORDER BY c.submitted_at DESC OFFSET @offset LIMIT @limit'
    params.push({ name: '@offset', value: offset })
    params.push({ name: '@limit', value: limit })

    const { resources } = await containers
      .submissions()
      .items.query<Submission>({ query, parameters: params })
      .fetchAll()

    return NextResponse.json({ submissions: resources, page, limit })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'porter') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const now = new Date().toISOString()
    const submission: Submission = {
      id: uuidv4(),
      porter_id: session.user.id,
      porter_name: session.user.name,
      submitted_at: now,
      updated_at: now,
      status: 'pending',
      review_status: 'pending',
      reviewed_by: null,
      reviewed_at: null,
      review_note: null,
      ...body,
    }

    await containers.submissions().items.create(submission)
    await appendAuditLog({
      action: 'submission.create',
      performed_by: session.user.id,
      performed_by_name: session.user.name,
      target_id: submission.id,
      target_type: 'submission',
      diff: { status: 'pending' },
    })

    return NextResponse.json({ submission }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
  }
}
