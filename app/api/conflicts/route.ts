import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { containers } from '@/lib/cosmos'
import type { Submission } from '@/lib/types'

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { resources } = await containers
      .submissions()
      .items.query<Submission>({
        query: "SELECT * FROM c WHERE c.s4_has_conflict = 'yes' AND (c.conflict_resolved = false OR NOT IS_DEFINED(c.conflict_resolved)) ORDER BY c.submitted_at DESC",
      })
      .fetchAll()

    return NextResponse.json({ conflicts: resources })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch conflicts' }, { status: 500 })
  }
}
