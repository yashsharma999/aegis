// Optimistic route protection for the authenticated app shell (Next.js 16 proxy,
// formerly "middleware").
//
// This is a fast cookie presence check only — NOT a security boundary. It just
// bounces signed-out users to /login before rendering. Real session validation
// happens server-side (lib/session.ts via auth.api.getSession) in the pages and
// route handlers that actually read user data.

import { NextResponse, type NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request)
  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
  return NextResponse.next()
}

// Matches the (app) route group. Public routes (/, /login, /signup, /onboarding,
// /family, /api/*) are intentionally excluded.
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/assistant/:path*',
    '/instructions/:path*',
    '/contacts/:path*',
    '/people/:path*',
    '/emergency/:path*',
    '/reminders/:path*',
    '/trigger/:path*',
    '/settings/:path*',
    '/vault/:path*',
  ],
}
