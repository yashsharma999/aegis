// Standalone Mastra server (run via `pnpm mastra:dev`, port 4111).
//
// The browser talks to it through @mastra/client-js. Per-request identity comes
// from the x-aegis-user-id header (set by the Next client from the authenticated
// session) → requestContext 'userId', which scopes every tool to that user.
// CORS is locked to the web origin.

import { Mastra } from '@mastra/core/mastra'
import { vaultAgent } from './agent'
import { storage } from './storage'

const webOrigin = (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(',')

export const mastra = new Mastra({
  agents: { vaultAgent },
  storage,
  server: {
    port: Number(process.env.MASTRA_PORT ?? 4111),
    cors: {
      origin: webOrigin,
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'x-mastra-client-type', 'x-aegis-user-id'],
      credentials: false,
    },
    middleware: [
      async (context, next) => {
        const userId = context.req.header('x-aegis-user-id')
        if (userId) context.get('requestContext').set('userId', userId)
        await next()
      },
    ],
  },
})
