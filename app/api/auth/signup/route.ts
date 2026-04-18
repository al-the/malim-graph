import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { containers } from '@/lib/cosmos'
import type { User } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, porter_id } = await req.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'All required fields must be filled.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    // Duplicate email check
    const { resources } = await containers
      .users()
      .items.query({
        query: 'SELECT c.id FROM c WHERE c.email = @email',
        parameters: [{ name: '@email', value: email }],
      })
      .fetchAll()
    if (resources.length > 0) {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const now = new Date().toISOString()
    const user: User = {
      id: uuidv4(),
      email,
      password: hashed,
      name,
      role,
      porter_id: role === 'porter' ? (porter_id || null) : null,
      status: 'pending',
      created_at: now,
      last_login: null,
    }

    await containers.users().items.create(user)
    return NextResponse.json({ message: 'Account created. Awaiting admin approval.' }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}
