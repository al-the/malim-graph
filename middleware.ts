import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public paths that never require a session.
const PUBLIC_PREFIXES = ['/login', '/signup', '/api/auth', '/_next', '/favicon.ico']

export function middleware(request: NextRequest) {
  const { pathname, protocol } = request.nextUrl

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Auth.js v5 names the session cookie differently by protocol.
  const secureName = '__Secure-authjs.session-token'
  const plainName = 'authjs.session-token'
  const hasSession =
    request.cookies.has(secureName) || request.cookies.has(plainName)

  if (!hasSession) {
    const loginUrl = new URL('/login', request.url)
    // Preserve the intended destination so we can redirect back after login.
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Run on every route; public paths are handled above.
  matcher: ['/((?!_next/static|_next/image).*)'],
}
