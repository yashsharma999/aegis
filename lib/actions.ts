'use server'

// All mutations flow through Server Actions over the mock store for now.
// TODO: back these with Aurora PostgreSQL writes + revalidation.

import { revalidatePath } from 'next/cache'
import { db } from './db'
import { askAgent, type AgentReply } from './agent'
import { transitions } from './checkin'
import { getSessionUser } from './session'
import { ingestDocument } from './documents/ingest'
import { PdfPasswordError } from './documents/parse'
import { deleteObject } from './storage'
import type { AppMode, TriggerState } from './types'

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024 // 20 MB

export async function sendAgentMessage(
  message: string,
  mode: AppMode,
  familyName?: string,
): Promise<AgentReply> {
  return askAgent(message, { mode, familyName })
}

export type TriggerAction =
  | 'emergency'
  | 'guardian'
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
    case 'guardian':
      next = transitions.grantTemporaryGuardian(prev)
      break
    case 'missed': {
      const missedCount = Math.min(checkin.missedCount + 1, checkin.threshold)
      await db.setCheckin({ ...checkin, missedCount })
      next = transitions.simulateMissedCheckin(prev, missedCount, checkin.threshold)
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
  revalidatePath('/emergency')
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
      error: 'unauthorized' | 'no_file' | 'not_pdf' | 'too_large' | 'needs_password' | 'wrong_password' | 'parse_failed'
    }

export async function addDocument(formData: FormData): Promise<AddDocumentResult> {
  const user = await getSessionUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'no_file' }
  if (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return { ok: false, error: 'not_pdf' }
  }
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: 'too_large' }

  const password = (formData.get('password') as string)?.trim() || undefined
  const bytes = new Uint8Array(await file.arrayBuffer())

  try {
    const result = await ingestDocument({
      userId: user.id,
      bytes,
      fileName: file.name,
      mimeType: file.type || 'application/pdf',
      category: (formData.get('category') as string) || 'digital',
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
