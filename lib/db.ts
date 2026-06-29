// Per-user data-access layer, backed by Aurora/Postgres via Drizzle.
//
// Every read is scoped to the signed-in user (lib/session.ts). New accounts
// start empty; the sample vault is loaded on demand via `pnpm db:seed` (lib/seed.ts).
// The trigger/check-in state machine lives in the 1:1 vault_profile row and is
// created lazily on first write.
//
// Reminders are derived live from policies + documents so statuses stay believable
// relative to "now". A future phase adds the pgvector table for document embeddings.

import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { db as orm } from './drizzle'
import * as schema from './schema'
import { getSessionUser } from './session'
import type {
  AppMode,
  Beneficiary,
  CheckinConfig,
  Contact,
  Credential,
  Document,
  DocumentCategory,
  Guardian,
  Instruction,
  InstructionType,
  Owner,
  Policy,
  PolicyType,
  TimelineEvent,
  TriggerState,
} from './types'

async function uid(): Promise<string | null> {
  return (await getSessionUser())?.id ?? null
}

type DocumentRow = typeof schema.document.$inferSelect

function toDocument(r: DocumentRow): Document {
  return {
    id: r.id,
    kind: r.kind as Document['kind'],
    category: r.category as DocumentCategory,
    title: r.title,
    fileName: r.fileName,
    body: r.body,
    notes: r.notes,
    sensitive: r.sensitive,
    uploadedAt: r.uploadedAt,
    updatedAt: r.updatedAt,
  }
}

const defaultTriggerState: TriggerState = { mode: 'everyday', timeline: [] }

const defaultCheckin: CheckinConfig = {
  cadenceDays: 14,
  lastCheckinAt: '',
  missedCount: 0,
  threshold: 3,
}

export const db = {
  getOwner: async (): Promise<Owner> => {
    const user = await getSessionUser()
    if (!user) return { id: 'owner-self', name: '', email: '', protecting: '' }
    const [profile] = await orm
      .select({ protecting: schema.vaultProfile.protecting })
      .from(schema.vaultProfile)
      .where(eq(schema.vaultProfile.userId, user.id))
    return { id: user.id, name: user.name, email: user.email, protecting: profile?.protecting ?? '' }
  },

  getDocuments: async (): Promise<Document[]> => {
    const id = await uid()
    if (!id) return []
    const rows = await orm.select().from(schema.document).where(eq(schema.document.userId, id))
    return rows.map(toDocument)
  },

  // Authored markdown notes (wishes, instructions, …) — the file-less items.
  getNotes: async (): Promise<Document[]> => {
    const id = await uid()
    if (!id) return []
    const rows = await orm
      .select()
      .from(schema.document)
      .where(and(eq(schema.document.userId, id), eq(schema.document.kind, 'note')))
    return rows.map(toDocument)
  },

  getDocumentById: async (docId: string): Promise<Document | null> => {
    const id = await uid()
    if (!id) return null
    const [r] = await orm
      .select()
      .from(schema.document)
      .where(and(eq(schema.document.userId, id), eq(schema.document.id, docId)))
    return r ? toDocument(r) : null
  },

  // Deletes a document + its chunks (scoped to the user) in one transaction and
  // returns the storageKey so the caller can clean up the stored object. Returns
  // null if the document doesn't exist / isn't the user's.
  deleteDocument: async (documentId: string): Promise<{ storageKey: string | null } | null> => {
    const id = await uid()
    if (!id) return null
    const [doc] = await orm
      .select({ storageKey: schema.document.storageKey })
      .from(schema.document)
      .where(and(eq(schema.document.userId, id), eq(schema.document.id, documentId)))
    if (!doc) return null
    await orm.transaction(async (tx) => {
      await tx
        .delete(schema.documentChunk)
        .where(
          and(
            eq(schema.documentChunk.userId, id),
            eq(schema.documentChunk.documentId, documentId),
          ),
        )
      await tx
        .delete(schema.document)
        .where(and(eq(schema.document.userId, id), eq(schema.document.id, documentId)))
    })
    return { storageKey: doc.storageKey }
  },

  getPolicies: async (): Promise<Policy[]> => {
    const id = await uid()
    if (!id) return []
    const rows = await orm.select().from(schema.policy).where(eq(schema.policy.userId, id))
    return rows.map((r) => ({
      id: r.id,
      type: r.type as PolicyType,
      provider: r.provider,
      policyNumber: r.policyNumber,
      coverageAmount: r.coverageAmount,
      premium: r.premium,
      renewalDate: r.renewalDate,
      networkHospitals: r.networkHospitals ?? undefined,
      claimContact: r.claimContact,
      claimSteps: r.claimSteps ?? undefined,
      notes: r.notes,
    }))
  },

  getPolicyById: async (polId: string): Promise<Policy | null> => {
    const id = await uid()
    if (!id) return null
    const [r] = await orm
      .select()
      .from(schema.policy)
      .where(and(eq(schema.policy.userId, id), eq(schema.policy.id, polId)))
    if (!r) return null
    return {
      id: r.id,
      type: r.type as PolicyType,
      provider: r.provider,
      policyNumber: r.policyNumber,
      coverageAmount: r.coverageAmount,
      premium: r.premium,
      renewalDate: r.renewalDate,
      networkHospitals: r.networkHospitals ?? undefined,
      claimContact: r.claimContact,
      claimSteps: r.claimSteps ?? undefined,
      notes: r.notes,
    }
  },

  getReminders: async () => {
    const id = await uid()
    if (!id) return []
    const [policies, documents] = await Promise.all([db.getPolicies(), db.getDocuments()])
    if (policies.length === 0 && documents.length === 0) return []
    const { buildReminders } = await import('./reminders')
    return buildReminders(policies, documents)
  },

  getBeneficiaries: async (): Promise<Beneficiary[]> => {
    const id = await uid()
    if (!id) return []
    const rows = await orm.select().from(schema.beneficiary).where(eq(schema.beneficiary.userId, id))
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      relationship: r.relationship,
      whatsapp: r.whatsapp,
      verificationSecret: r.verificationSecret,
      accessScope: r.accessScope as DocumentCategory[],
      status: r.status as Beneficiary['status'],
    }))
  },

  upsertBeneficiary: async (
    b: { id?: string; name: string; relationship: string; whatsapp: string; status: Beneficiary['status'] },
  ): Promise<string | null> => {
    const id = await uid()
    if (!id) return null
    const rowId = b.id || randomUUID()
    const values = { name: b.name, relationship: b.relationship, whatsapp: b.whatsapp, status: b.status }
    await orm
      .insert(schema.beneficiary)
      .values({ userId: id, id: rowId, ...values })
      .onConflictDoUpdate({ target: [schema.beneficiary.userId, schema.beneficiary.id], set: values })
    return rowId
  },

  deleteBeneficiary: async (beneficiaryId: string): Promise<boolean> => {
    const id = await uid()
    if (!id) return false
    await orm
      .delete(schema.beneficiary)
      .where(and(eq(schema.beneficiary.userId, id), eq(schema.beneficiary.id, beneficiaryId)))
    return true
  },

  getGuardians: async (): Promise<Guardian[]> => {
    const id = await uid()
    if (!id) return []
    const rows = await orm.select().from(schema.guardian).where(eq(schema.guardian.userId, id))
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      relationship: r.relationship,
      whatsapp: r.whatsapp,
      role: r.role as Guardian['role'],
    }))
  },

  getInstructions: async (): Promise<Instruction[]> => {
    const id = await uid()
    if (!id) return []
    const rows = await orm.select().from(schema.instruction).where(eq(schema.instruction.userId, id))
    return rows.map((r) => ({
      id: r.id,
      type: r.type as InstructionType,
      title: r.title,
      body: r.body,
    }))
  },

  getContacts: async (): Promise<Contact[]> => {
    const id = await uid()
    if (!id) return []
    const rows = await orm.select().from(schema.contact).where(eq(schema.contact.userId, id))
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      role: r.role,
      phone: r.phone,
      notes: r.notes,
    }))
  },

  upsertContact: async (c: Omit<Contact, 'id'> & { id?: string }): Promise<string | null> => {
    const id = await uid()
    if (!id) return null
    const rowId = c.id || randomUUID()
    const values = { name: c.name, role: c.role, phone: c.phone, notes: c.notes }
    await orm
      .insert(schema.contact)
      .values({ userId: id, id: rowId, ...values })
      .onConflictDoUpdate({ target: [schema.contact.userId, schema.contact.id], set: values })
    return rowId
  },

  deleteContact: async (contactId: string): Promise<boolean> => {
    const id = await uid()
    if (!id) return false
    await orm
      .delete(schema.contact)
      .where(and(eq(schema.contact.userId, id), eq(schema.contact.id, contactId)))
    return true
  },

  // ── Legacy-access grants (tokenized beneficiary links) ──────────────────────
  createAccessGrant: async (beneficiaryId: string): Promise<string | null> => {
    const id = await uid()
    if (!id) return null
    const token = randomUUID()
    await orm.insert(schema.accessGrant).values({
      token,
      ownerId: id,
      beneficiaryId,
      createdAt: new Date().toISOString(),
    })
    return token
  },

  revokeAccessGrant: async (token: string): Promise<boolean> => {
    const id = await uid()
    if (!id) return false
    await orm
      .update(schema.accessGrant)
      .set({ revokedAt: new Date().toISOString() })
      .where(and(eq(schema.accessGrant.ownerId, id), eq(schema.accessGrant.token, token)))
    return true
  },

  listAccessGrants: async (): Promise<
    { token: string; beneficiaryId: string; createdAt: string; revokedAt: string | null }[]
  > => {
    const id = await uid()
    if (!id) return []
    const rows = await orm
      .select({
        token: schema.accessGrant.token,
        beneficiaryId: schema.accessGrant.beneficiaryId,
        createdAt: schema.accessGrant.createdAt,
        revokedAt: schema.accessGrant.revokedAt,
      })
      .from(schema.accessGrant)
      .where(eq(schema.accessGrant.ownerId, id))
    return rows
  },

  // ── Telegram pairing ────────────────────────────────────────────────────────
  // Owner mints a one-time code in the app, then sends `/start <code>` to the
  // bot. The session-less worker consumes it (lib/telegram/resolve.ts). Codes
  // expire after 15 minutes.
  createTelegramPairCode: async (): Promise<string | null> => {
    const id = await uid()
    if (!id) return null
    // Short, human-typeable code (the deep-link also carries it verbatim).
    const code = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
    const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString()
    await orm.insert(schema.telegramPairCode).values({
      code,
      userId: id,
      expiresAt,
    })
    return code
  },

  // Credentials are SHIELDED from the agent: stored here, never chunked/indexed,
  // and surfaced by no agent tool.
  getCredentials: async (): Promise<Credential[]> => {
    const id = await uid()
    if (!id) return []
    const rows = await orm.select().from(schema.credential).where(eq(schema.credential.userId, id))
    return rows.map((r) => ({
      id: r.id,
      label: r.label,
      username: r.username,
      secret: r.secret,
      url: r.url,
      notes: r.notes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }))
  },

  upsertCredential: async (
    c: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ): Promise<string | null> => {
    const id = await uid()
    if (!id) return null
    const rowId = c.id || randomUUID()
    const now = new Date().toISOString()
    const fields = { label: c.label, username: c.username, secret: c.secret, url: c.url, notes: c.notes }
    await orm
      .insert(schema.credential)
      .values({ userId: id, id: rowId, createdAt: now, ...fields })
      .onConflictDoUpdate({
        target: [schema.credential.userId, schema.credential.id],
        set: { ...fields, updatedAt: now },
      })
    return rowId
  },

  deleteCredential: async (credentialId: string): Promise<boolean> => {
    const id = await uid()
    if (!id) return false
    await orm
      .delete(schema.credential)
      .where(and(eq(schema.credential.userId, id), eq(schema.credential.id, credentialId)))
    return true
  },

  getTriggerState: async (): Promise<TriggerState> => {
    const id = await uid()
    if (!id) return defaultTriggerState
    const [r] = await orm
      .select({ mode: schema.vaultProfile.mode, timeline: schema.vaultProfile.timeline })
      .from(schema.vaultProfile)
      .where(eq(schema.vaultProfile.userId, id))
    if (!r) return defaultTriggerState
    return { mode: r.mode as AppMode, timeline: (r.timeline as TimelineEvent[]) ?? [] }
  },

  setTriggerState: async (next: TriggerState) => {
    const id = await uid()
    if (!id) return
    await orm
      .insert(schema.vaultProfile)
      .values({ userId: id, mode: next.mode, timeline: next.timeline })
      .onConflictDoUpdate({
        target: schema.vaultProfile.userId,
        set: { mode: next.mode, timeline: next.timeline },
      })
  },

  getCheckin: async (): Promise<CheckinConfig> => {
    const id = await uid()
    if (!id) return defaultCheckin
    const [r] = await orm
      .select({
        cadenceDays: schema.vaultProfile.cadenceDays,
        lastCheckinAt: schema.vaultProfile.lastCheckinAt,
        missedCount: schema.vaultProfile.missedCount,
        threshold: schema.vaultProfile.threshold,
      })
      .from(schema.vaultProfile)
      .where(eq(schema.vaultProfile.userId, id))
    if (!r) return defaultCheckin
    return {
      cadenceDays: r.cadenceDays,
      lastCheckinAt: r.lastCheckinAt ?? '',
      missedCount: r.missedCount,
      threshold: r.threshold,
    }
  },

  setCheckin: async (next: CheckinConfig) => {
    const id = await uid()
    if (!id) return
    await orm
      .insert(schema.vaultProfile)
      .values({
        userId: id,
        cadenceDays: next.cadenceDays,
        lastCheckinAt: next.lastCheckinAt || null,
        missedCount: next.missedCount,
        threshold: next.threshold,
      })
      .onConflictDoUpdate({
        target: schema.vaultProfile.userId,
        set: {
          cadenceDays: next.cadenceDays,
          lastCheckinAt: next.lastCheckinAt || null,
          missedCount: next.missedCount,
          threshold: next.threshold,
        },
      })
  },
}
