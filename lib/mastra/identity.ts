// Per-request identity for the in-process agent routes (app/api/agent/*), the
// Vercel-native replacement for the standalone Mastra server's middleware
// (lib/mastra/index.ts). Same contract: a beneficiary presents a grant TOKEN
// (resolved to the owner, gated on legacy mode); an owner presents their user
// id (+ optional mode). Both end up as RequestContext keys the agent reads.

import { RequestContext } from '@mastra/core/request-context'
import { getOwnerName, resolveGrant } from '../access'

export type Identity =
  | { ok: true; requestContext: RequestContext; userId: string }
  | { ok: false; status: number; error: string }

export async function identityFromHeaders(headers: Headers): Promise<Identity> {
  const requestContext = new RequestContext()

  const grantToken = headers.get('x-aegis-grant-token')
  if (grantToken) {
    const grant = await resolveGrant(grantToken)
    if (!grant.valid || !grant.legacyActive || !grant.ownerId) {
      return { ok: false, status: 403, error: 'This access link is not active.' }
    }
    requestContext.set('userId', grant.ownerId)
    requestContext.set('mode', 'legacy')
    requestContext.set('actorName', grant.beneficiaryName)
    requestContext.set('ownerName', grant.ownerName)
    return { ok: true, requestContext, userId: grant.ownerId }
  }

  const userId = headers.get('x-aegis-user-id')
  if (!userId) return { ok: false, status: 401, error: 'Not authenticated.' }
  requestContext.set('userId', userId)
  const mode = headers.get('x-aegis-mode')
  if (mode) requestContext.set('mode', mode)
  // Owner previewing their own vault in legacy mode → give the persona their name.
  if (mode === 'legacy') requestContext.set('ownerName', await getOwnerName(userId))
  return { ok: true, requestContext, userId }
}
