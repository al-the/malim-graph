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
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-primary">MalimDB</h1>
          <p className="text-sm text-text-secondary mt-1 flex items-center justify-center gap-1">
            build with{' '}
            <svg className="w-3 h-3 text-red-500 inline-block flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
            </svg>
            {' '}by porter
          </p>
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
              placeholder="your email"
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
      <footer className="mt-6 text-center">
        <span className="text-[11px] text-text-disabled">
          &copy; {new Date().getFullYear()} Malim AI Labs Social Enterprise. All right reserved.
        </span>
      </footer>
    </div>
  )
}
