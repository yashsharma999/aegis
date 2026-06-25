// User-scoped vault queries for the agent tools.
//
// The standalone Mastra server has no Next session/next-headers, so tools can't
// use lib/db (which self-resolves the session user). These take an explicit
// userId (from requestContext) and query Drizzle directly. Rows are returned
// roughly as-is — the agent reads them as JSON.

import { and, eq } from 'drizzle-orm'
import { db as orm } from '../drizzle'
import * as schema from '../schema'
import { buildReminders } from '../reminders'
import type { Document, Policy } from '../types'

export function vaultFor(userId: string) {
  return {
    documentById: async (id: string) => {
      const [row] = await orm
        .select()
        .from(schema.document)
        .where(and(eq(schema.document.userId, userId), eq(schema.document.id, id)))
      return row ?? null
    },
    documentFullText: async (id: string) => {
      const rows = await orm
        .select({ content: schema.documentChunk.content })
        .from(schema.documentChunk)
        .where(and(eq(schema.documentChunk.userId, userId), eq(schema.documentChunk.documentId, id)))
        .orderBy(schema.documentChunk.chunkIndex)
      return rows.map((r) => r.content).join('\n\n')
    },
    contacts: () => orm.select().from(schema.contact).where(eq(schema.contact.userId, userId)),
    // Reminders derive due dates from any structured policies plus uploaded
    // documents. With document-only vaults this falls back to document-derived
    // dates; structured policies contribute only when seeded.
    reminders: async () => {
      const [policies, documents] = await Promise.all([
        orm.select().from(schema.policy).where(eq(schema.policy.userId, userId)),
        orm.select().from(schema.document).where(eq(schema.document.userId, userId)),
      ])
      if (policies.length === 0 && documents.length === 0) return []
      return buildReminders(policies as unknown as Policy[], documents as unknown as Document[])
    },
  }
}
