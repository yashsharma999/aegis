import { after, NextResponse } from 'next/server'
import { parseUpdate, type RawUpdate } from '@/lib/telegram/client'
import { handleMessage } from '@/lib/telegram/handle'

// Production ingress for Telegram (the alternative to the polling worker). The
// bot's webhook is registered with `pnpm telegram:webhook <prod-url>`, after
// which Telegram POSTs each update here.
//
// The agent turn can take many seconds, so we ACK immediately (200) and finish
// the work in after() — Telegram never retries, and there are no duplicate
// replies. maxDuration keeps the background work alive (Vercel Fluid compute).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? ''

export async function POST(request: Request) {
  // Reject anything that isn't Telegram echoing our registered secret token.
  if (SECRET && request.headers.get('x-telegram-bot-api-secret-token') !== SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const update = (await request.json().catch(() => null)) as RawUpdate | null
  const msg = update ? parseUpdate(update) : null

  // Run the agent turn after responding so we ACK within Telegram's timeout.
  if (msg) after(() => handleMessage(msg))

  // Always 200, even for updates we ignore, so Telegram considers them delivered.
  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    note: 'Telegram webhook. Register it with `pnpm telegram:webhook <prod-url>`.',
  })
}
