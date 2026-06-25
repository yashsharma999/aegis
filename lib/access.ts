// Session-less access-grant resolution. Safe to import from the standalone
// Mastra server process (lib/mastra/*) and from public route handlers — it
// queries Drizzle directly and never touches the Next session.
//
// A grant ties a token to an owner + beneficiary. It only opens the vault when
// the owner's vault is actually in `legacy` mode (the executor-confirmed
// trigger). The browser presents the token; the owner id is resolved here.

import { and, eq } from 'drizzle-orm'
import { db as orm } from './drizzle'
import * as schema from './schema'

export interface ResolvedGrant {
  valid: boolean // token exists and is not revoked/expired
  legacyActive: boolean // owner's vault is currently in legacy mode
  ownerId: string | null
  ownerName: string
  beneficiaryName: string
}

const INVALID: ResolvedGrant = {
  valid: false,
  legacyActive: false,
  ownerId: null,
  ownerName: '',
  beneficiaryName: '',
}

// Session-less owner display name (used by the Mastra middleware for the owner's
// own legacy preview).
export async function getOwnerName(ownerId: string): Promise<string> {
  const [owner] = await orm
    .select({ name: schema.user.name })
    .from(schema.user)
    .where(eq(schema.user.id, ownerId))
  return owner?.name ?? ''
}

export async function resolveGrant(token: string): Promise<ResolvedGrant> {
  if (!token) return INVALID

  const [grant] = await orm
    .select()
    .from(schema.accessGrant)
    .where(eq(schema.accessGrant.token, token))
  if (!grant) return INVALID

  const expired = grant.expiresAt ? new Date(grant.expiresAt).getTime() < Date.now() : false
  if (grant.revokedAt || expired) {
    return { ...INVALID, ownerId: grant.ownerId }
  }

  // Owner display name + current vault mode.
  const [owner] = await orm
    .select({ name: schema.user.name })
    .from(schema.user)
    .where(eq(schema.user.id, grant.ownerId))
  const [profile] = await orm
    .select({ mode: schema.vaultProfile.mode })
    .from(schema.vaultProfile)
    .where(eq(schema.vaultProfile.userId, grant.ownerId))

  // Beneficiary display name (scoped to the owner's vault).
  const [beneficiary] = await orm
    .select({ name: schema.beneficiary.name })
    .from(schema.beneficiary)
    .where(
      and(
        eq(schema.beneficiary.userId, grant.ownerId),
        eq(schema.beneficiary.id, grant.beneficiaryId),
      ),
    )

  return {
    valid: true,
    legacyActive: profile?.mode === 'legacy',
    ownerId: grant.ownerId,
    ownerName: owner?.name ?? 'your loved one',
    beneficiaryName: beneficiary?.name ?? 'there',
  }
}
