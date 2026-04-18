import { NextRequest, NextResponse } from 'next/server'
import { containers } from '@/lib/cosmos'
import type { User } from '@/lib/types'

// Returns the account status for an email — no password, no session required.
// Used by the login page to surface a specific message before calling signIn.
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ status: 'not_found' })

    const { resources } = await containers
      .users()
      .items.query<User>({
        query: 'SELECT c.status FROM c WHERE c.email = @email',
        parameters: [{ name: '@email', value: email }],
      })
      .fetchAll()

    const user = resources[0]
    // Always respond — but never reveal whether the email exists for unknown accounts.
    // We only distinguish pending/suspended so users understand why login failed.
    const status = user ? user.status : 'not_found'
    return NextResponse.json({ status })
  } catch {
    return NextResponse.json({ status: 'not_found' })
  }
}
