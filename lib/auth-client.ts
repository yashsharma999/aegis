// Browser-side Better Auth client. Used by the login/signup pages and the
// sidebar sign-out. Requests are sent to the catch-all route at /api/auth.

import { createAuthClient } from 'better-auth/react'

// No baseURL: the client targets the current origin, which is correct for the
// same-app /api/auth routes in every environment.
export const authClient = createAuthClient()

export const { signIn, signUp, signOut, useSession } = authClient
