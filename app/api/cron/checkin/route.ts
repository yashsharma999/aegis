import { eq } from 'drizzle-orm'
import { db as orm } from '@/lib/drizzle'
import * as schema from '@/lib/schema'
import { notifyOwnerByUserId, checkinNudgeText } from '@/lib/telegram/notify'
import type { TimelineEvent } from '@/lib/types'

// Production check-in scheduler (Vercel Cron, daily — see vercel.json). For each
// owner still in everyday mode, advance missed check-ins once per elapsed cadence
// window, nudge them on Telegram, and at the threshold move the vault to the
// pre-triggered (incapacity) state awaiting executor confirmation. Idempotent:
// it only advances when a new cadence window has actually lapsed.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DAY_MS = 86_400_000

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 })
  }

  const now = Date.now()
  const profiles = await orm
    .select()
    .from(schema.vaultProfile)
    .where(eq(schema.vaultProfile.mode, 'everyday'))

  let nudged = 0
  let triggered = 0
  for (const p of profiles) {
    if (!p.lastCheckinAt) continue
    const windows = Math.floor((now - new Date(p.lastCheckinAt).getTime()) / (p.cadenceDays * DAY_MS))
    if (windows <= p.missedCount) continue // no new window lapsed

    const missed = Math.min(windows, p.threshold)
    const timeline = (Array.isArray(p.timeline) ? p.timeline : []) as TimelineEvent[]
    const at = new Date(now).toISOString()

    if (missed >= p.threshold) {
      const event: TimelineEvent = {
        state: 'Pre-triggered',
        at,
        note: `Check-in threshold reached (${missed}/${p.threshold}). Awaiting executor confirmation.`,
      }
      await orm
        .update(schema.vaultProfile)
        .set({ mode: 'incapacity', missedCount: missed, timeline: [...timeline, event] })
        .where(eq(schema.vaultProfile.userId, p.userId))
      await notifyOwnerByUserId(p.userId, checkinNudgeText(missed, p.threshold))
      triggered++
    } else {
      const event: TimelineEvent = {
        state: 'Missed check-in',
        at,
        note: `Owner missed a check-in (${missed}/${p.threshold}).`,
      }
      await orm
        .update(schema.vaultProfile)
        .set({ missedCount: missed, timeline: [...timeline, event] })
        .where(eq(schema.vaultProfile.userId, p.userId))
      if (await notifyOwnerByUserId(p.userId, checkinNudgeText(missed, p.threshold))) nudged++
    }
  }

  return Response.json({ ok: true, scanned: profiles.length, nudged, triggered })
}
