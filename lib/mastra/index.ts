// Standalone Mastra server (run via `pnpm mastra:dev`, port 4111).
//
// The browser talks to it through @mastra/client-js. Per-request identity comes
// from the x-aegis-user-id header (set by the Next client from the authenticated
// session) → requestContext 'userId', which scopes every tool to that user.
// CORS is locked to the web origin.

import { Mastra } from '@mastra/core/mastra'
import { vaultAgent } from './agent'
import { storage } from './storage'
import { resolveGrant, getOwnerName } from '../access'

const webOrigin = (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(',')

export const mastra = new Mastra({
  agents: { vaultAgent },
  storage,
  server: {
    port: Number(process.env.MASTRA_PORT ?? 4111),
    cors: {
      origin: webOrigin,
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: [
        'Content-Type',
        'x-mastra-client-type',
        'x-aegis-user-id',
        'x-aegis-grant-token',
        'x-aegis-mode',
      ],
      credentials: false,
    },
    middleware: [
      // Per-request identity. A beneficiary presents a grant TOKEN (never an
      // owner id): we resolve it to the owner here and only open the vault if
      // it's actually in legacy mode. An owner presents their user id (+ an
      // optional mode for self-previewing legacy).
      async (context, next) => {
        const requestContext = context.get('requestContext')
        const grantToken = context.req.header('x-aegis-grant-token')

        if (grantToken) {
          const grant = await resolveGrant(grantToken)
          if (!grant.valid || !grant.legacyActive || !grant.ownerId) {
            return context.json({ error: 'This access link is not active.' }, 403)
          }
          requestContext.set('userId', grant.ownerId)
          requestContext.set('mode', 'legacy')
          requestContext.set('actorName', grant.beneficiaryName)
          requestContext.set('ownerName', grant.ownerName)
          await next()
          return
        }

        const userId = context.req.header('x-aegis-user-id')
        if (userId) requestContext.set('userId', userId)
        const mode = context.req.header('x-aegis-mode')
        if (mode) requestContext.set('mode', mode)
        // Owner previewing their own vault in legacy mode — give the persona the
        // owner's name (only a query on the rare preview, not everyday chat).
        if (userId && mode === 'legacy') {
          requestContext.set('ownerName', await getOwnerName(userId))
        }
        await next()
      },
    ],
  },
})
