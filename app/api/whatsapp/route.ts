import { NextResponse } from 'next/server'
import { askAgent } from '@/lib/agent'
import { db } from '@/lib/db'
import type { AppMode } from '@/lib/types'

// Stub webhook.
// TODO: wire to Twilio WhatsApp sandbox — inbound owner (everyday/emergency) and
// family (legacy) messages route here to askAgent with the correct mode.

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const message: string = body?.Body ?? body?.message ?? ''

  // The active app mode gates which data/tools the agent may use.
  const { mode } = await db.getTriggerState()
  const reply = await askAgent(message, { mode: mode as AppMode, familyName: body?.familyName })

  // TODO: respond via Twilio's WhatsApp API instead of returning JSON.
  return NextResponse.json({ reply: reply.text, sourceDoc: reply.sourceDoc, mode })
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    note: 'WhatsApp webhook stub. POST a message body to route it to the agent.',
  })
}
