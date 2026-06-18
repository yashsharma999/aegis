// Better Auth server instance. The single source of truth for authentication.
//
// Backed by Aurora Postgres via the Drizzle adapter (lib/drizzle.ts +
// lib/schema.ts). Email/password is enabled with auto sign-in after signup.
// Session reads happen server-side via auth.api.getSession (see lib/session.ts);
// the browser talks to this through the /api/auth catch-all route.

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { db } from './drizzle'
import * as schema from './schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 6,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
})
