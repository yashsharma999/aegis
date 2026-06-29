// Outbound Telegram notifications to a vault OWNER (check-in nudges, escalation).
// Session-less: resolves the owner's linked chat and sends. Returns whether a
// message actually went out, so callers can tell the truth in the timeline.

import { and, eq } from 'drizzle-orm'
import { db as orm } from '../drizzle'
import * as schema from '../schema'
import { sendMessage } from './client'

export async function notifyOwnerByUserId(userId: string, text: string): Promise<boolean> {
  const [link] = await orm
    .select({ chatId: schema.telegramLink.chatId })
    .from(schema.telegramLink)
    .where(and(eq(schema.telegramLink.userId, userId), eq(schema.telegramLink.role, 'owner')))
  if (!link) return false
  try {
    await sendMessage(link.chatId, text)
    return true
  } catch {
    return false
  }
}

// The reminder copy the owner gets on a missed check-in.
export function checkinNudgeText(missed: number, threshold: number): string {
  if (missed >= threshold) {
    return (
      `⚠️ *Aegis* — you've missed ${threshold} check-ins. Your vault is now pre-triggered and your ` +
      `executor has been asked to confirm. Open Aegis and tap "I'm well" if this is a mistake.`
    )
  }
  return (
    `🔔 *Aegis check-in* — you've missed ${missed} of ${threshold}. Open Aegis and tap ` +
    `"I'm well — check in now" to reset the timer.`
  )
}
