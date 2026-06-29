// Non-streaming entry point to the vault agent (used by the WhatsApp webhook
// stub). The streaming UI paths — owner chat and beneficiary Legacy Mode — go
// through the standalone Mastra server (components/assistant/* → :4111), which
// resolves identity (user id or grant token) and persona from request headers.
//
// Legacy Mode is no longer a separate mock: it is the same real agent over the
// owner's real vault, gated by the access-grant token (see lib/access.ts).

import { RequestContext } from '@mastra/core/request-context'
import { vaultAgent } from './mastra/agent'
import { getSessionUser } from './session'
import type { AppMode } from './types'

export interface AgentReply {
  text: string
}

interface AgentContext {
  mode: AppMode
}

// Session-less turn against a known vault, used by ingresses that resolve
// identity out-of-band (e.g. the Telegram worker). Sets the same RequestContext
// keys the Mastra server middleware sets (lib/mastra/index.ts), and partitions
// memory by an explicit thread/resource so each external chat keeps its own
// history.
export interface VaultTurn {
  userId: string
  mode: AppMode
  message: string
  thread: string
  resource: string
  ownerName?: string // legacy persona only
  actorName?: string // legacy persona only (the beneficiary)
}

export async function runVaultTurn(turn: VaultTurn): Promise<AgentReply> {
  const requestContext = new RequestContext()
  requestContext.set('userId', turn.userId)
  requestContext.set('mode', turn.mode)
  if (turn.ownerName) requestContext.set('ownerName', turn.ownerName)
  if (turn.actorName) requestContext.set('actorName', turn.actorName)

  const result = await vaultAgent.generate([{ role: 'user', content: turn.message }], {
    requestContext,
    maxSteps: 10,
    memory: { thread: turn.thread, resource: turn.resource },
  })
  return { text: result.text }
}

export async function askAgent(message: string, context: AgentContext): Promise<AgentReply> {
  // The agent reasons over the signed-in user's vault. No session (e.g. the
  // WhatsApp webhook) → tools return empty → the agent says so.
  const user = await getSessionUser()
  const requestContext = new RequestContext()
  if (user) requestContext.set('userId', user.id)
  requestContext.set('mode', context.mode)

  const result = await vaultAgent.generate([{ role: 'user', content: message }], {
    requestContext,
    maxSteps: 10,
  })
  return { text: result.text }
}
