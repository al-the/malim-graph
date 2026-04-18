'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type ErrorKind = 'invalid' | 'pending' | 'suspended' | ''

const ERROR_UI: Record<Exclude<ErrorKind, ''>, { text: string; cls: string }> = {
  invalid: {
    text: 'Invalid email or password.',
    cls: 'text-danger bg-red-50 border-red-200',
  },
  pending: {
    text: 'Your account is awaiting admin approval. You will be notified once an administrator reviews your request.',
    cls: 'text-warning bg-amber-50 border-amber-200',
  },
  suspended: {
    text: 'Your account has been suspended. Please contact an administrator.',
    cls: 'text-danger bg-red-50 border-red-200',
  },
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorKind, setErrorKind] = useState<ErrorKind>('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorKind('')
    setLoading(true)

    try {
      // Check account status first so we can show a specific message.
      const preRes = await fetch('/api/auth/preflight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const { status } = await preRes.json()

      if (status === 'pending') { setErrorKind('pending'); return }
      if (status === 'suspended') { setErrorKind('suspended'); return }

      // Account is active (or not found — let signIn return generic error).
      const res = await signIn('credentials', { email, password, redirect: false })
      if (res?.error) {
        setErrorKind('invalid')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const errInfo = errorKind ? ERROR_UI[errorKind] : null

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-primary">Malim</h1>
          <p className="text-sm text-text-secondary mt-1">Knowledge Graph Portal</p>
        </div>

        <div className="bg-bg-surface rounded-lg border border-border shadow-card p-8">
          <h2 className="text-xl font-semibold text-text-primary mb-6">Sign in to your account</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@organisation.gov.my"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />

            {errInfo && (
              <p className={`text-2xs border rounded px-3 py-2 ${errInfo.cls}`}>{errInfo.text}</p>
            )}

            <Button type="submit" loading={loading} className="w-full mt-2">
              Sign in
            </Button>
          </form>

          <p className="text-2xs text-text-secondary text-center mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-accent hover:underline">
              Request access
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
