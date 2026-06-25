// Browser client for the standalone Mastra server (pnpm mastra:dev, :4111).
//
// Per-request identity rides as headers → the server's middleware copies them
// into requestContext, scoping every tool to the signed-in user. Headers bind
// at construction, so build a fresh client when userId/mode changes.

import { MastraClient } from '@mastra/client-js'

export const VAULT_AGENT_ID = 'vault-agent'

const baseUrl = process.env.NEXT_PUBLIC_MASTRA_URL ?? 'http://localhost:4111'

export const mastraClient = new MastraClient({ baseUrl, credentials: 'omit' })

export function mastraClientFor(opts: {
  userId?: string | null
  grantToken?: string | null
  mode?: string | null
  abortSignal?: AbortSignal
}): MastraClient {
  const headers: Record<string, string> = {}
  // A beneficiary presents a grant token (no owner id); the owner presents their
  // user id. The Mastra middleware resolves either into requestContext.
  if (opts.grantToken) headers['x-aegis-grant-token'] = opts.grantToken
  else if (opts.userId) headers['x-aegis-user-id'] = opts.userId
  if (opts.mode) headers['x-aegis-mode'] = opts.mode
  if (!opts.abortSignal && Object.keys(headers).length === 0) return mastraClient
  return new MastraClient({
    baseUrl,
    credentials: 'omit',
    headers,
    ...(opts.abortSignal ? { abortSignal: opts.abortSignal } : {}),
  })
}
