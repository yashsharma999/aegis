// Server-side session helpers, backed by Better Auth.
//
// Reads the validated session from the request headers. During this auth phase
// there is no per-user vault yet, so any authenticated user sees the sample
// vault (see lib/db.ts). Per-user data lands in a later phase.

import { headers } from 'next/headers'
import { auth } from './auth'

type SessionUser = {
  id: string
  name: string
  email: string
}

async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getSession()
  if (!session) return null
  const { id, name, email } = session.user
  return { id, name, email }
}

export async function getSessionEmail(): Promise<string | null> {
  return (await getSession())?.user.email ?? null
}

// True when a real user is signed in.
export async function isAuthenticated(): Promise<boolean> {
  return !!(await getSession())
}
