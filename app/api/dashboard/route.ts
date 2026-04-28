import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { containers } from '@/lib/cosmos'
import type { Submission, Layer0Submission } from '@/lib/types'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const role = session.user.role

    if (role === 'porter') {
      const { resources } = await containers
        .submissions()
        .items.query<Layer0Submission>({
          query: 'SELECT * FROM c WHERE c.porter_id = @id AND c.layer = 0',
          parameters: [{ name: '@id', value: session.user.id }],
        })
        .fetchAll()

      const approved = resources.filter((s) => s.status === 'approved').length
      const pending = resources.filter((s) => s.status === 'pending').length
      const rejected = resources.filter((s) => s.status === 'rejected').length
      const indexed = resources.filter((s) => s.ingestion_status === 'complete').length
      const recent = resources
        .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))
        .slice(0, 10)

      // All system-wide pending + approved titles to prevent duplicate submissions
      const { resources: allActive } = await containers
        .submissions()
        .items.query<Pick<Layer0Submission, 'id' | 's1_title_en' | 's1_source_authority' | 'status' | 'porter_id'>>({
          query: "SELECT c.id, c.s1_title_en, c.s1_source_authority, c.status, c.porter_id FROM c WHERE c.layer = 0 AND c.status IN ('pending', 'approved')",
        })
        .fetchAll()

      return NextResponse.json({ role, total_submitted: resources.length, approved, pending, rejected, indexed, recent, all_active_titles: allActive })
    }

    if (role === 'supervisor' || role === 'admin') {
      const { resources: all } = await containers
        .submissions()
        .items.query<Layer0Submission>({
          query: 'SELECT * FROM c WHERE c.layer = 0',
        })
        .fetchAll()

      const today = new Date().toISOString().slice(0, 10)
      const pending_review = all.filter((s) => s.status === 'pending').length
      const approved_today = all.filter(
        (s) => s.status === 'approved' && s.reviewed_at?.startsWith(today),
      ).length
      const rejected = all.filter((s) => s.status === 'rejected').length

      const porterIds = Array.from(new Set(all.map((s) => s.porter_id)))
      const active_porters = porterIds.length

      const pendingQueue = all
        .filter((s) => s.status === 'pending')
        .sort((a, b) => a.submitted_at.localeCompare(b.submitted_at))
        .slice(0, 10)

      // Porter leaderboard
      const leaderboard = porterIds.map((pid) => {
        const psubs = all.filter((s) => s.porter_id === pid)
        return {
          porter_id: pid,
          porter_name: psubs[0]?.porter_name || pid,
          approved: psubs.filter((s) => s.status === 'approved').length,
          pending: psubs.filter((s) => s.status === 'pending').length,
          total: psubs.length,
        }
      }).sort((a, b) => b.approved - a.approved)

      // Layer 0 ingestion stats
      const ingestion_queue = all.filter(
        (s) => s.ingestion_status === 'promoting' || s.ingestion_status === 'chunking' || s.ingestion_status === 'failed',
      )

      // Documents indexed count
      let documents_indexed = 0
      let chunks_generated = 0
      try {
        const { resources: docCount } = await containers
          .documents()
          .items.query<number>({ query: 'SELECT VALUE COUNT(1) FROM c WHERE c.node_type = @t', parameters: [{ name: '@t', value: 'Document' }] })
          .fetchAll()
        documents_indexed = docCount[0] ?? 0

        const { resources: chunkCount } = await containers
          .chunks()
          .items.query<number>({ query: 'SELECT VALUE COUNT(1) FROM c WHERE c.node_type = @t', parameters: [{ name: '@t', value: 'Chunk' }] })
          .fetchAll()
        chunks_generated = chunkCount[0] ?? 0
      } catch {
        // Non-fatal
      }

      let extra: Record<string, unknown> = {}
      if (role === 'admin') {
        // Pending user registrations
        const { resources: pendingUsers } = await containers
          .users()
          .items.query({
            query: "SELECT c.id, c.name, c.email, c.role, c.porter_id, c.created_at FROM c WHERE c.status = 'pending' ORDER BY c.created_at ASC",
          })
          .fetchAll()

        extra = { pending_registrations: pendingUsers, unresolved_conflicts: 0 }
      }

      return NextResponse.json({
        role,
        total_submissions: all.length,
        pending_review,
        approved_today,
        rejected,
        active_porters,
        pending_queue: pendingQueue,
        leaderboard,
        documents_indexed,
        chunks_generated,
        ingestion_queue,
        ...extra,
      })
    }

    return NextResponse.json({ error: 'Unknown role' }, { status: 400 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
