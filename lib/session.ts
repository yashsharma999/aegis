// Server-side session helpers. Reads the signed-in email from a cookie and
// decides whether the current user is the demo account (full sample data) or
// a regular account (empty vault).
//
// TODO: replace the cookie check with a real session (Better Auth) once a
// backend is wired up.

import { cookies } from 'next/headers'
import { SESSION_COOKIE, DEMO_EMAIL } from './constants'

export async function getSessionEmail(): Promise<string | null> {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value ?? null
}

export async function isDemoUser(): Promise<boolean> {
  const email = await getSessionEmail()
  return email?.toLowerCase() === DEMO_EMAIL
}
