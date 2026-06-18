// Per-user data-access layer, backed by Aurora/Postgres via Drizzle.
//
// Every read is scoped to the signed-in user (lib/session.ts). New accounts
// start empty; the sample vault is loaded on demand via `pnpm db:seed` (lib/seed.ts).
// The trigger/check-in state machine lives in the 1:1 vault_profile row and is
// created lazily on first write.
//
// Reminders are derived live from policies + documents so statuses stay believable
// relative to "now". A future phase adds the pgvector table for document embeddings.

import { and, eq } from 'drizzle-orm'
import { db as orm } from './drizzle'
import * as schema from './schema'
import { getSessionUser } from './session'
import type {
  AppMode,
  Beneficiary,
  CheckinConfig,
  Contact,
  Document,
  DocumentCategory,
  Guardian,
  Instruction,
  InstructionType,
  MedicalProfile,
  Owner,
  Policy,
  PolicyType,
  TimelineEvent,
  TriggerState,
} from './types'

async function uid(): Promise<string | null> {
  return (await getSessionUser())?.id ?? null
}

const emptyMedicalProfile: MedicalProfile = {
  bloodGroup: '',
  allergies: [],
  medications: [],
  conditions: [],
  activeHealthPolicyId: '',
  preferredHospital: '',
  emergencyNote: '',
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
    return rows.map((r) => ({
      id: r.id,
      category: r.category as DocumentCategory,
      title: r.title,
      fileName: r.fileName,
      notes: r.notes,
      sensitive: r.sensitive,
      uploadedAt: r.uploadedAt,
    }))
  },

  getDocumentById: async (docId: string): Promise<Document | null> => {
    const id = await uid()
    if (!id) return null
    const [r] = await orm
      .select()
      .from(schema.document)
      .where(and(eq(schema.document.userId, id), eq(schema.document.id, docId)))
    if (!r) return null
    return {
      id: r.id,
      category: r.category as DocumentCategory,
      title: r.title,
      fileName: r.fileName,
      notes: r.notes,
      sensitive: r.sensitive,
      uploadedAt: r.uploadedAt,
    }
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

  getMedicalProfile: async (): Promise<MedicalProfile> => {
    const id = await uid()
    if (!id) return emptyMedicalProfile
    const [r] = await orm
      .select()
      .from(schema.medicalProfile)
      .where(eq(schema.medicalProfile.userId, id))
    if (!r) return emptyMedicalProfile
    return {
      bloodGroup: r.bloodGroup,
      allergies: r.allergies,
      medications: r.medications,
      conditions: r.conditions,
      activeHealthPolicyId: r.activeHealthPolicyId,
      preferredHospital: r.preferredHospital,
      emergencyNote: r.emergencyNote,
    }
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
