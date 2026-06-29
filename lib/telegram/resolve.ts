// Session-less Telegram-sender → vault-identity resolution. Sibling to
// lib/access.ts: queries Drizzle directly, never touches the Next session.
//
// A sender is one of:
//   - 'owner'        — linked to their own vault (role 'owner').
//   - 'beneficiary'  — linked via a legacy grant token; the grant is re-checked
//                      on EVERY message (revocation / legacy-mode gating).
//   - 'locked'       — a beneficiary whose grant is revoked/expired or whose
//                      owner's vault isn't in legacy mode yet.
//   - 'unlinked'     — no mapping; must /start <code|token> to bind.

import { randomUUID } from 'node:crypto'
import { and, eq, isNull } from 'drizzle-orm'
import { resolveGrant } from '../access'
import { db as orm } from '../drizzle'
import * as schema from '../schema'
import type { AppMode } from '../types'
import type { VaultTurn } from '../agent'

export type SenderResolution =
  | { kind: 'unlinked' }
  | { kind: 'locked'; reason: string }
  | { kind: 'ready'; turn: Omit<VaultTurn, 'message'> }

export async function resolveSender(telegramUserId: number | string): Promise<SenderResolution> {
  const [link] = await orm
    .select()
    .from(schema.telegramLink)
    .where(eq(schema.telegramLink.telegramUserId, String(telegramUserId)))
  if (!link) return { kind: 'unlinked' }

  if (link.role === 'beneficiary' && link.grantToken) {
    const grant = await resolveGrant(link.grantToken)
    if (!grant.valid || !grant.ownerId) {
      return { kind: 'locked', reason: 'This access link is no longer valid.' }
    }
    if (!grant.legacyActive) {
      return {
        kind: 'locked',
        reason: `${grant.ownerName}'s vault isn't open yet. I'll be here when it is.`,
      }
    }
    return {
      kind: 'ready',
      turn: {
        userId: grant.ownerId,
        mode: 'legacy',
        ownerName: grant.ownerName,
        actorName: grant.beneficiaryName,
        thread: `tg:grant:${link.grantToken}`,
        resource: `grant:${link.grantToken}`,
      },
    }
  }

  // Owner: mirror the vault's current mode (normally 'everyday').
  const [profile] = await orm
    .select({ mode: schema.vaultProfile.mode })
    .from(schema.vaultProfile)
    .where(eq(schema.vaultProfile.userId, link.userId))
  const mode = (profile?.mode as AppMode) ?? 'everyday'
  return {
    kind: 'ready',
    turn: {
      userId: link.userId,
      mode,
      thread: `tg:owner:${link.userId}`,
      resource: link.userId,
    },
  }
}

// ── Binding (/start <arg>) ────────────────────────────────────────────────────

export type BindResult =
  | { ok: true; role: 'owner' | 'beneficiary'; greeting: string }
  | { ok: false; message: string }

// Try a one-time owner pairing code first, then fall back to a beneficiary
// grant token. Returns ok:false if neither matches.
export async function bindSender(
  telegramUserId: number | string,
  chatId: number | string,
  displayName: string,
  arg: string,
): Promise<BindResult> {
  const tgId = String(telegramUserId)
  const code = arg.trim()

  // 1) Owner pairing code (8-char, case-insensitive).
  const [pair] = await orm
    .select()
    .from(schema.telegramPairCode)
    .where(
      and(eq(schema.telegramPairCode.code, code.toUpperCase()), isNull(schema.telegramPairCode.usedAt)),
    )
  if (pair) {
    if (new Date(pair.expiresAt).getTime() < Date.now()) {
      return { ok: false, message: 'That pairing code has expired. Generate a fresh one in Aegis.' }
    }
    await orm
      .update(schema.telegramPairCode)
      .set({ usedAt: new Date().toISOString() })
      .where(eq(schema.telegramPairCode.code, pair.code))
    await upsertLink(tgId, chatId, 'owner', pair.userId, null, displayName)
    return { ok: true, role: 'owner', greeting: `You're linked, ${displayName}. Ask me anything about your vault.` }
  }

  // 2) Beneficiary grant token.
  const grant = await resolveGrant(code)
  if (grant.valid && grant.ownerId) {
    await upsertLink(tgId, chatId, 'beneficiary', grant.ownerId, code, displayName)
    const note = grant.legacyActive
      ? `You're connected to ${grant.ownerName}'s vault.`
      : `You're linked. ${grant.ownerName}'s vault isn't open yet — I'll be here when it is.`
    return { ok: true, role: 'beneficiary', greeting: note }
  }

  return { ok: false, message: 'I didn\'t recognize that code. Use the link or code from Aegis.' }
}

// Bind a beneficiary by the phone number they shared (the frictionless path):
// match it against `beneficiary.whatsapp`, then find-or-create their access
// grant so the rest of the model (legacy-mode gating, memory partitioning)
// works exactly as with a token link.
export async function bindByPhone(
  telegramUserId: number | string,
  chatId: number | string,
  phone: string,
  displayName: string,
): Promise<BindResult> {
  const target = normalizePhone(phone)
  if (!target) return { ok: false, message: 'That number looked empty — please try again.' }

  // Match across all owners' beneficiaries (a number identifies one person).
  const rows = await orm
    .select({
      userId: schema.beneficiary.userId,
      id: schema.beneficiary.id,
      whatsapp: schema.beneficiary.whatsapp,
    })
    .from(schema.beneficiary)
  const matches = rows.filter((r) => phoneMatches(r.whatsapp, target))

  if (matches.length === 0) {
    return {
      ok: false,
      message: 'I don\'t recognize this number yet. Ask the vault owner to add you, then try again.',
    }
  }
  if (matches.length > 1) {
    return {
      ok: false,
      message: 'This number is registered with more than one vault. Please use the access link you were sent.',
    }
  }

  const { userId: ownerId, id: beneficiaryId } = matches[0]
  const token = await findOrCreateGrant(ownerId, beneficiaryId)
  await upsertLink(String(telegramUserId), chatId, 'beneficiary', ownerId, token, displayName)

  const grant = await resolveGrant(token)
  const note = grant.legacyActive
    ? `You're connected to ${grant.ownerName}'s vault, ${displayName}.`
    : `You're linked, ${displayName}. ${grant.ownerName}'s vault isn't open yet — I'll be here when it is.`
  return { ok: true, role: 'beneficiary', greeting: note }
}

// Reuse an existing active grant for this beneficiary, else mint one.
async function findOrCreateGrant(ownerId: string, beneficiaryId: string): Promise<string> {
  const [existing] = await orm
    .select({ token: schema.accessGrant.token })
    .from(schema.accessGrant)
    .where(
      and(
        eq(schema.accessGrant.ownerId, ownerId),
        eq(schema.accessGrant.beneficiaryId, beneficiaryId),
        isNull(schema.accessGrant.revokedAt),
      ),
    )
  if (existing) return existing.token

  const token = randomUUID()
  await orm.insert(schema.accessGrant).values({
    token,
    ownerId,
    beneficiaryId,
    createdAt: new Date().toISOString(),
  })
  return token
}

// Compare phone numbers leniently: digits only, matched on the last 10 (so
// "+91 98860 12345" and "919886012345" resolve to the same person).
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}
function phoneMatches(stored: string | null, target: string): boolean {
  const a = normalizePhone(stored ?? '')
  if (!a || !target) return false
  const tail = (s: string) => s.slice(-10)
  return a === target || (a.length >= 10 && target.length >= 10 && tail(a) === tail(target))
}

async function upsertLink(
  telegramUserId: string,
  chatId: number | string,
  role: 'owner' | 'beneficiary',
  userId: string,
  grantToken: string | null,
  displayName: string,
): Promise<void> {
  await orm
    .insert(schema.telegramLink)
    .values({
      telegramUserId,
      chatId: String(chatId),
      role,
      userId,
      grantToken,
      displayName,
      createdAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: schema.telegramLink.telegramUserId,
      set: { chatId: String(chatId), role, userId, grantToken, displayName },
    })
}
