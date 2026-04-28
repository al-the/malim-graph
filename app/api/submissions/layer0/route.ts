import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { containers } from '@/lib/cosmos'
import { appendAuditLog } from '@/lib/audit'
import { v4 as uuidv4 } from 'uuid'
import type { Layer0Submission } from '@/lib/types'

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
    let query = 'SELECT * FROM c WHERE c.layer = 0'
    const params: { name: string; value: string | number }[] = []

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
      .items.query<Layer0Submission>({ query, parameters: params })
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
  if (session.user.role !== 'porter') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const now = new Date().toISOString()

    const submission: Layer0Submission = {
      id: uuidv4(),
      layer: 0,
      porter_id: session.user.id,
      porter_name: session.user.name,
      submitted_at: now,
      updated_at: now,
      status: 'pending',
      reviewed_by: null,
      reviewed_at: null,
      review_note: null,

      s1_title_en: body.s1_title_en || '',
      s1_title_ms: body.s1_title_ms || '',
      s1_source_authority: body.s1_source_authority || '',
      s1_doc_type: body.s1_doc_type || '',
      s1_series: body.s1_series || '',
      s1_url: body.s1_url || '',
      s1_published_date: body.s1_published_date || '',
      s1_ref_period_start: body.s1_ref_period_start || null,
      s1_ref_period_end: body.s1_ref_period_end || null,
      s1_language: Array.isArray(body.s1_language) ? body.s1_language : ['en'],

      s2_summary_en: body.s2_summary_en || '',
      s2_summary_ms: body.s2_summary_ms || '',
      s2_doc_status: body.s2_doc_status || 'final',
      s2_updates_previous: Boolean(body.s2_updates_previous),
      s2_updates_which: body.s2_updates_which || '',
      s2_topics: Array.isArray(body.s2_topics) ? body.s2_topics : [],
      s2_geography: Array.isArray(body.s2_geography) ? body.s2_geography : [],

      checklist: {
        url_is_direct: Boolean(body.checklist?.url_is_direct),
        title_is_exact: Boolean(body.checklist?.title_is_exact),
        read_document: Boolean(body.checklist?.read_document),
        is_original_work: Boolean(body.checklist?.is_original_work),
      },

      promoted_doc_id: null,
      chunks_generated: null,
      ingestion_status: null,
    }

    await containers.submissions().items.create(submission)
    await appendAuditLog({
      action: 'submission.layer0.create',
      performed_by: session.user.id,
      performed_by_name: session.user.name,
      target_id: submission.id,
      target_type: 'layer0_submission',
      diff: { status: 'pending', layer: 0 },
    })

    return NextResponse.json({ submission }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
  }
}
