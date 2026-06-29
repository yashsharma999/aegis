'use server'

// All mutations flow through Server Actions over the mock store for now.
// TODO: back these with Aurora PostgreSQL writes + revalidation.

import { revalidatePath } from 'next/cache'
import { db } from './db'
import { transitions } from './checkin'
import { getSessionUser } from './session'
import { notifyOwnerByUserId, checkinNudgeText } from './telegram/notify'
import { ingestFile, ingestNote, reindexNote } from './documents/ingest'
import { PdfPasswordError } from './documents/parse'
import { deleteObject } from './storage'
import type { TriggerState } from './types'

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024 // 20 MB

export type TriggerAction =
  | 'emergency'
  | 'missed'
  | 'executor'
  | 'reset'

export async function runTrigger(action: TriggerAction): Promise<TriggerState> {
  const prev = await db.getTriggerState()
  const checkin = await db.getCheckin()
  let next: TriggerState

  switch (action) {
    case 'emergency':
      next = transitions.triggerEmergency(prev)
      break
    case 'missed': {
      const missedCount = Math.min(checkin.missedCount + 1, checkin.threshold)
      await db.setCheckin({ ...checkin, missedCount })
      // Actually nudge the owner on Telegram (if they've connected it).
      const user = await getSessionUser()
      const nudged = user
        ? await notifyOwnerByUserId(user.id, checkinNudgeText(missedCount, checkin.threshold))
        : false
      next = transitions.simulateMissedCheckin(prev, missedCount, checkin.threshold, nudged)
      break
    }
    case 'executor':
      next = transitions.executorConfirms(prev)
      break
    case 'reset':
    default:
      next = transitions.reset()
      await db.setCheckin({
        ...checkin,
        missedCount: 0,
        lastCheckinAt: new Date().toISOString(),
      })
      break
  }

  await db.setTriggerState(next)
  revalidatePath('/trigger')
  revalidatePath('/dashboard')
  return next
}

export async function confirmCheckin() {
  const checkin = await db.getCheckin()
  await db.setCheckin({
    ...checkin,
    missedCount: 0,
    lastCheckinAt: new Date().toISOString(),
  })
  revalidatePath('/dashboard')
  revalidatePath('/settings/checkin')
}

export type AddDocumentResult =
  | { ok: true; documentId: string; chunkCount: number }
  | {
      ok: false
      error:
        | 'unauthorized'
        | 'no_file'
        | 'unsupported_type'
        | 'too_large'
        | 'needs_password'
        | 'wrong_password'
        | 'parse_failed'
    }

function isSupportedUpload(file: File): boolean {
  const name = file.name.toLowerCase()
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return true
  if (file.type.startsWith('image/')) return true
  if (/\.(png|jpe?g|gif|webp|heic|avif)$/.test(name)) return true
  return false
}

export async function addDocument(formData: FormData): Promise<AddDocumentResult> {
  const user = await getSessionUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'no_file' }
  if (!isSupportedUpload(file)) return { ok: false, error: 'unsupported_type' }
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: 'too_large' }

  const password = (formData.get('password') as string)?.trim() || undefined
  const bytes = new Uint8Array(await file.arrayBuffer())

  try {
    const result = await ingestFile({
      userId: user.id,
      bytes,
      fileName: file.name,
      mimeType: file.type || 'application/pdf',
      category: (formData.get('category') as string) || 'documents',
      title: (formData.get('title') as string) || undefined,
      notes: (formData.get('notes') as string) || undefined,
      sensitive: formData.get('sensitive') === 'on' || formData.get('sensitive') === 'true',
      password,
    })
    revalidatePath('/vault/documents')
    return { ok: true, documentId: result.documentId, chunkCount: result.chunkCount }
  } catch (err) {
    if (err instanceof PdfPasswordError) return { ok: false, error: err.reason }
    console.error('addDocument failed:', err)
    return { ok: false, error: 'parse_failed' }
  }
}

// ── Notes (authored markdown: wishes, instructions, …) ───────────────────────

export type SaveResult = { ok: true; id: string } | { ok: false; error: string }

export async function saveNote(formData: FormData): Promise<SaveResult> {
  const user = await getSessionUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const id = (formData.get('id') as string)?.trim() || undefined
  const title = (formData.get('title') as string)?.trim() || ''
  const body = (formData.get('body') as string) || ''
  const category = (formData.get('category') as string) || 'wishes'
  const notes = (formData.get('notes') as string) || ''
  const sensitive = formData.get('sensitive') === 'on' || formData.get('sensitive') === 'true'
  if (!title && !body.trim()) return { ok: false, error: 'empty' }

  try {
    const result = id
      ? await reindexNote({ userId: user.id, documentId: id, title, category, body, notes, sensitive })
      : await ingestNote({ userId: user.id, category, title, body, notes, sensitive })
    revalidatePath('/instructions')
    revalidatePath('/vault/documents')
    return { ok: true, id: result.documentId }
  } catch (err) {
    console.error('saveNote failed:', err)
    return { ok: false, error: 'save_failed' }
  }
}

// ── Contacts (structured) ────────────────────────────────────────────────────

export async function saveContact(formData: FormData): Promise<SaveResult> {
  const user = await getSessionUser()
  if (!user) return { ok: false, error: 'unauthorized' }
  const name = (formData.get('name') as string)?.trim() || ''
  if (!name) return { ok: false, error: 'name_required' }
  const id = await db.upsertContact({
    id: (formData.get('id') as string)?.trim() || undefined,
    name,
    role: (formData.get('role') as string)?.trim() || '',
    phone: (formData.get('phone') as string)?.trim() || '',
    notes: (formData.get('notes') as string) || '',
  })
  if (!id) return { ok: false, error: 'unauthorized' }
  revalidatePath('/contacts')
  return { ok: true, id }
}

export async function deleteContact(contactId: string): Promise<{ ok: boolean }> {
  const ok = await db.deleteContact(contactId)
  revalidatePath('/contacts')
  return { ok }
}

// ── Credentials (structured, shielded from the agent) ────────────────────────

export async function saveCredential(formData: FormData): Promise<SaveResult> {
  const user = await getSessionUser()
  if (!user) return { ok: false, error: 'unauthorized' }
  const label = (formData.get('label') as string)?.trim() || ''
  if (!label) return { ok: false, error: 'label_required' }
  const id = await db.upsertCredential({
    id: (formData.get('id') as string)?.trim() || undefined,
    label,
    username: (formData.get('username') as string)?.trim() || '',
    secret: (formData.get('secret') as string) || '',
    url: (formData.get('url') as string)?.trim() || '',
    notes: (formData.get('notes') as string) || '',
  })
  if (!id) return { ok: false, error: 'unauthorized' }
  revalidatePath('/credentials')
  return { ok: true, id }
}

export async function deleteCredential(credentialId: string): Promise<{ ok: boolean }> {
  const ok = await db.deleteCredential(credentialId)
  revalidatePath('/credentials')
  return { ok }
}

// ── Beneficiaries (people who can be granted Legacy-Mode access) ─────────────

export async function saveBeneficiary(formData: FormData): Promise<SaveResult> {
  const user = await getSessionUser()
  if (!user) return { ok: false, error: 'unauthorized' }
  const name = (formData.get('name') as string)?.trim() || ''
  if (!name) return { ok: false, error: 'name_required' }
  const id = await db.upsertBeneficiary({
    id: (formData.get('id') as string)?.trim() || undefined,
    name,
    relationship: (formData.get('relationship') as string)?.trim() || '',
    whatsapp: (formData.get('whatsapp') as string)?.trim() || '',
    // Starts unverified; becomes 'verified' when they connect on Telegram
    // (their phone number matches — see lib/telegram/resolve.ts). Ignored on edit.
    status: 'pending',
  })
  if (!id) return { ok: false, error: 'unauthorized' }
  revalidatePath('/people')
  return { ok: true, id }
}

export async function deleteBeneficiary(beneficiaryId: string): Promise<{ ok: boolean }> {
  const ok = await db.deleteBeneficiary(beneficiaryId)
  revalidatePath('/people')
  return { ok }
}

// ── Legacy access links ──────────────────────────────────────────────────────

export async function createLegacyLink(
  beneficiaryId: string,
): Promise<{ ok: true; token: string } | { ok: false }> {
  const user = await getSessionUser()
  if (!user) return { ok: false }
  const token = await db.createAccessGrant(beneficiaryId)
  if (!token) return { ok: false }
  revalidatePath('/people')
  return { ok: true, token }
}

export async function revokeLegacyLink(token: string): Promise<{ ok: boolean }> {
  const ok = await db.revokeAccessGrant(token)
  revalidatePath('/people')
  return { ok }
}

// Mints a one-time code the owner sends to the Telegram bot (`/start <code>`)
// to link their own account to their vault. See scripts/telegram.ts.
export async function createTelegramPairCode(): Promise<
  { ok: true; code: string } | { ok: false }
> {
  const user = await getSessionUser()
  if (!user) return { ok: false }
  const code = await db.createTelegramPairCode()
  if (!code) return { ok: false }
  return { ok: true, code }
}

export async function deleteNote(noteId: string): Promise<{ ok: boolean }> {
  const result = await db.deleteDocument(noteId)
  revalidatePath('/instructions')
  revalidatePath('/vault/documents')
  return { ok: !!result }
}

export async function deleteDocument(documentId: string): Promise<{ ok: boolean }> {
  const user = await getSessionUser()
  if (!user) return { ok: false }
  const result = await db.deleteDocument(documentId)
  if (!result) return { ok: false }
  if (result.storageKey) {
    try {
      await deleteObject(result.storageKey)
    } catch (err) {
      // The DB rows are already gone; a stray object isn't worth failing the action.
      console.error('Failed to delete stored object:', err)
    }
  }
  revalidatePath('/vault/documents')
  return { ok: true }
}
