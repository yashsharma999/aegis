'use server'

// UI-level auth actions. No password verification yet — any credentials sign in.
// The email determines whether you see the demo vault or an empty one.
//
// TODO: validate credentials against Better Auth / a real user store.

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE } from './constants'

export async function signIn(email: string) {
  const store = await cookies()
  store.set(SESSION_COOKIE, email.trim().toLowerCase(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function signOut() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  redirect('/login')
}
