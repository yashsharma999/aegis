// Loads the sample vault into a user's account as real per-user rows.
//
// New signups start empty (by design). Run `pnpm db:seed <email>` to populate
// an existing account for a demo. Idempotent: replaces any existing vault rows
// for that user. Domain object ids are reused as the per-user row ids, so the
// sample's internal references (e.g. medical.activeHealthPolicyId -> a policy)
// stay valid within the user's scope.

import { eq } from 'drizzle-orm'
import { db as orm } from './drizzle'
import * as schema from './schema'
import { ingestNote } from './documents/ingest'
import {
  beneficiaries,
  checkinConfig,
  contacts,
  credentials,
  documents,
  initialTriggerState,
  instructions,
  owner,
  policies,
} from './mock-data'
import type { InstructionType } from './types'

// Funeral wishes / personal messages read as "wishes"; the rest are practical
// "instructions". Both become agent-visible markdown notes.
const INSTRUCTION_CATEGORY: Record<InstructionType, 'wishes' | 'instructions'> = {
  funeral: 'wishes',
  messages: 'wishes',
  first24: 'instructions',
  financial: 'instructions',
}

export async function clearVault(userId: string) {
  await Promise.all([
    orm.delete(schema.documentChunk).where(eq(schema.documentChunk.userId, userId)),
    orm.delete(schema.document).where(eq(schema.document.userId, userId)),
    orm.delete(schema.policy).where(eq(schema.policy.userId, userId)),
    orm.delete(schema.beneficiary).where(eq(schema.beneficiary.userId, userId)),
    orm.delete(schema.instruction).where(eq(schema.instruction.userId, userId)),
    orm.delete(schema.contact).where(eq(schema.contact.userId, userId)),
    orm.delete(schema.credential).where(eq(schema.credential.userId, userId)),
    orm.delete(schema.vaultProfile).where(eq(schema.vaultProfile.userId, userId)),
  ])
}

export async function seedVault(userId: string) {
  await clearVault(userId)

  await orm.insert(schema.document).values(
    documents.map((d) => ({
      userId,
      id: d.id,
      category: d.category,
      title: d.title,
      fileName: d.fileName,
      notes: d.notes,
      sensitive: d.sensitive,
      uploadedAt: d.uploadedAt,
    })),
  )

  await orm.insert(schema.policy).values(
    policies.map((p) => ({
      userId,
      id: p.id,
      type: p.type,
      provider: p.provider,
      policyNumber: p.policyNumber,
      coverageAmount: p.coverageAmount,
      premium: p.premium,
      renewalDate: p.renewalDate,
      networkHospitals: p.networkHospitals ?? null,
      claimContact: p.claimContact,
      claimSteps: p.claimSteps ?? null,
      notes: p.notes,
    })),
  )

  await orm.insert(schema.beneficiary).values(
    beneficiaries.map((b) => ({
      userId,
      id: b.id,
      name: b.name,
      relationship: b.relationship,
      whatsapp: b.whatsapp,
      verificationSecret: b.verificationSecret,
      accessScope: b.accessScope,
      status: b.status,
    })),
  )

  // Wishes & instructions are seeded as agent-visible markdown notes (with
  // chunks), not structured rows — matching how users author them in-app.
  for (const i of instructions) {
    await ingestNote({
      userId,
      category: INSTRUCTION_CATEGORY[i.type],
      title: i.title,
      body: i.body,
    })
  }

  await orm.insert(schema.contact).values(
    contacts.map((c) => ({
      userId,
      id: c.id,
      name: c.name,
      role: c.role,
      phone: c.phone,
      notes: c.notes,
    })),
  )

  await orm.insert(schema.credential).values(
    credentials.map((c) => ({
      userId,
      id: c.id,
      label: c.label,
      username: c.username,
      secret: c.secret,
      url: c.url,
      notes: c.notes,
      createdAt: c.createdAt,
    })),
  )

  await orm.insert(schema.vaultProfile).values({
    userId,
    protecting: owner.protecting,
    mode: initialTriggerState.mode,
    timeline: initialTriggerState.timeline,
    cadenceDays: checkinConfig.cadenceDays,
    lastCheckinAt: checkinConfig.lastCheckinAt,
    missedCount: checkinConfig.missedCount,
    threshold: checkinConfig.threshold,
  })
}
