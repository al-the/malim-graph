import { handlers } from '@/lib/auth'
import { NextRequest } from 'next/server'

// Auth.js v5 on Vercel sometimes receives a bare hostname ('example.vercel.app')
// instead of a full URL when constructing internal redirect targets.
// This wrapper guarantees the request URL is always absolute before Auth.js sees it.
function withAbsoluteURL(req: NextRequest): NextRequest {
  if (req.url.startsWith('http://') || req.url.startsWith('https://')) return req
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  const host =
    req.headers.get('x-forwarded-host') ??
    req.headers.get('host') ??
    'localhost:3000'
  const absolute = `${proto}://${host}${req.nextUrl.pathname}${req.nextUrl.search}`
  return new NextRequest(absolute, req)
}

export const GET = (req: NextRequest) => handlers.GET(withAbsoluteURL(req))
export const POST = (req: NextRequest) => handlers.POST(withAbsoluteURL(req))
