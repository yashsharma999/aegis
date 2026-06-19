// User-scoped vault queries for the agent tools.
//
// The standalone Mastra server has no Next session/next-headers, so tools can't
// use lib/db (which self-resolves the session user). These take an explicit
// userId (from requestContext) and query Drizzle directly. Rows are returned
// roughly as-is — the agent reads them as JSON.

import { eq } from 'drizzle-orm'
import { db as orm } from '../drizzle'
import * as schema from '../schema'
import { buildReminders } from '../reminders'
import type { Document, Policy } from '../types'

export function vaultFor(userId: string) {
  return {
    policies: () => orm.select().from(schema.policy).where(eq(schema.policy.userId, userId)),
    documents: () => orm.select().from(schema.document).where(eq(schema.document.userId, userId)),
    medical: async () => {
      const [row] = await orm
        .select()
        .from(schema.medicalProfile)
        .where(eq(schema.medicalProfile.userId, userId))
      return row ?? null
    },
    contacts: () => orm.select().from(schema.contact).where(eq(schema.contact.userId, userId)),
    beneficiaries: () =>
      orm.select().from(schema.beneficiary).where(eq(schema.beneficiary.userId, userId)),
    instructions: () =>
      orm.select().from(schema.instruction).where(eq(schema.instruction.userId, userId)),
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
