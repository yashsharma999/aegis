'use server'

// All mutations flow through Server Actions over the mock store for now.
// TODO: back these with Aurora PostgreSQL writes + revalidation.

import { revalidatePath } from 'next/cache'
import { db } from './db'
import { askAgent, type AgentReply } from './agent'
import { transitions } from './checkin'
import type { AppMode, TriggerState } from './types'

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

export async function addDocument(_formData: FormData) {
  // TODO: persist uploaded file metadata + embeddings to Aurora pgvector.
  // For the demo we just acknowledge — the mock store is read-only seed data.
  revalidatePath('/vault/documents')
}
