'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

export default function SignupPage() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'porter', porter_id: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          porter_id: form.role === 'porter' ? form.porter_id : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Registration failed.')
        return
      }
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-primary">Malim</h1>
          <p className="text-sm text-text-secondary mt-1">Knowledge Graph Portal</p>
        </div>

        <div className="bg-bg-surface rounded-lg border border-border shadow-card p-8">
          {done ? (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-text-primary text-center">Request submitted</h2>
              <p className="text-xs text-text-secondary text-center">
                Your account is pending admin approval. You will be able to sign in once an administrator approves your request.
              </p>
              <Link href="/login" className="text-2xs text-accent hover:underline mt-2">
                Return to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-text-primary mb-6">Create an account</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="Full name"
                  required
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  autoComplete="name"
                  placeholder="Your full name"
                />
                <Input
                  label="Email address"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  autoComplete="email"
                  placeholder="you@organisation.gov.my"
                />
                <Input
                  label="Password"
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  autoComplete="new-password"
                  helper="Minimum 8 characters"
                />
                <Input
                  label="Confirm password"
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                  autoComplete="new-password"
                />
                <Select
                  label="I am requesting access as"
                  required
                  value={form.role}
                  onChange={(e) => set('role', e.target.value)}
                  options={[
                    { value: 'porter', label: 'Porter (data entry)' },
                    { value: 'supervisor', label: 'Supervisor (reviewer)' },
                  ]}
                />
                {form.role === 'porter' && (
                  <Input
                    label="Porter ID (if assigned)"
                    value={form.porter_id}
                    onChange={(e) => set('porter_id', e.target.value)}
                    placeholder="E.g. P0042"
                    helper="Leave blank if not yet assigned"
                  />
                )}

                {error && (
                  <p className="text-2xs text-danger bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
                )}

                <Button type="submit" loading={loading} className="w-full mt-2">
                  Request access
                </Button>
              </form>

              <p className="text-2xs text-text-secondary text-center mt-6">
                Already have an account?{' '}
                <Link href="/login" className="text-accent hover:underline">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
