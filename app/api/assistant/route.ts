// Legacy/family assistant endpoint (public, sample data, no Mastra server).
//
// Authenticated chat now goes straight to the standalone Mastra server via
// @mastra/client-js (see components/assistant/*). This route only serves the
// public family preview (mode: 'legacy'), which uses sample data. It replies as
// a single NDJSON text frame so the existing AgentChat client can consume it.

import { askAgent } from '@/lib/agent'
import type { AppMode } from '@/lib/types'

export const runtime = 'nodejs'

type IncomingMessage = { role: 'user' | 'assistant'; content: string }

export async function POST(req: Request) {
  let payload: { messages?: IncomingMessage[]; mode?: AppMode; familyName?: string }
  try {
    payload = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const messages = (payload.messages ?? []).filter((m) => m?.content?.trim())
  const mode: AppMode = payload.mode ?? 'everyday'
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''
  if (!lastUser) return new Response('No message', { status: 400 })

  const { text } = await askAgent(lastUser, { mode, familyName: payload.familyName })
  const body = JSON.stringify({ t: 'text', v: text }) + '\n'
  return new Response(body, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
