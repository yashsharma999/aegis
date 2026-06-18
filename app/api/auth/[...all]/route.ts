// Better Auth catch-all handler. Serves sign-in, sign-up, sign-out, session,
// and all other Better Auth endpoints under /api/auth/*.

import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
