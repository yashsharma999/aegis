// Server-side session helpers. Reads the signed-in email from a cookie.
//
// This is a demo experience, so any signed-in user sees the fully-populated
// sample vault — there is no real backend and no per-user storage.
//
// TODO: replace the cookie check with a real session (Better Auth) and
// per-user data once a backend is wired up.

import { cookies } from 'next/headers'
import { SESSION_COOKIE } from './constants'

export async function getSessionEmail(): Promise<string | null> {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value ?? null
}

// Any signed-in user gets the sample vault for the demo.
export async function isDemoUser(): Promise<boolean> {
  const email = await getSessionEmail()
  return !!email
}
