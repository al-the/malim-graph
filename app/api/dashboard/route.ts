import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { containers } from '@/lib/cosmos'
import type { Submission } from '@/lib/types'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const role = session.user.role

    if (role === 'porter') {
      const { resources } = await containers
        .submissions()
        .items.query<Submission>({
          query: 'SELECT * FROM c WHERE c.porter_id = @id',
          parameters: [{ name: '@id', value: session.user.id }],
        })
        .fetchAll()

      const approved = resources.filter((s) => s.status === 'approved').length
      const pending = resources.filter((s) => s.status === 'pending').length
      const rejected = resources.filter((s) => s.status === 'rejected').length
      const recent = resources
        .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))
        .slice(0, 10)

      // All system-wide pending + approved titles to prevent duplicate submissions
      const { resources: allActive } = await containers
        .submissions()
        .items.query<Pick<Submission, 'id' | 's1_title_en' | 's1_source_authority' | 'status' | 'porter_id'>>({
          query: "SELECT c.id, c.s1_title_en, c.s1_source_authority, c.status, c.porter_id FROM c WHERE c.status IN ('pending', 'approved')",
        })
        .fetchAll()

      return NextResponse.json({ role, total_submitted: resources.length, approved, pending, rejected, recent, all_active_titles: allActive })
    }

    if (role === 'supervisor' || role === 'admin') {
      const { resources: all } = await containers
        .submissions()
        .items.query<Submission>('SELECT * FROM c')
        .fetchAll()

      const today = new Date().toISOString().slice(0, 10)
      const pending_review = all.filter((s) => s.status === 'pending').length
      const approved_today = all.filter((s) => s.status === 'approved' && s.reviewed_at?.startsWith(today)).length
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

      let extra: Record<string, unknown> = {}
      if (role === 'admin') {
        const conflicts = all.filter((s) => s.s4_has_conflict === 'yes' && !s.conflict_resolved).length

        // Pending user registrations
        const { resources: pendingUsers } = await containers
          .users()
          .items.query({
            query: "SELECT c.id, c.name, c.email, c.role, c.porter_id, c.created_at FROM c WHERE c.status = 'pending' ORDER BY c.created_at ASC",
          })
          .fetchAll()

        extra = { unresolved_conflicts: conflicts, pending_registrations: pendingUsers }
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
        ...extra,
      })
    }

    return NextResponse.json({ error: 'Unknown role' }, { status: 400 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
