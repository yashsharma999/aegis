// The vault assistant brain.
//
// Non-legacy modes use the Mastra agent (lib/mastra/agent.ts), which reasons over
// the signed-in user's real vault via tools (BM25 search + structured getters).
// Legacy is the public family-preview demo and stays on sample data (lib/mock-data)
// — it must never touch a real user's vault.
//
// This module is the non-streaming entry point (used by the WhatsApp webhook and
// the assistant route's legacy branch). The streaming UI path lives in
// app/api/assistant/route.ts.

import { RequestContext } from '@mastra/core/request-context'
import {
  instructions as sampleInstructions,
  owner,
  policies as samplePolicies,
} from './mock-data'
import { vaultAgent } from './mastra/agent'
import { getSessionUser } from './session'
import type { AppMode } from './types'

export interface AgentReply {
  text: string
  sourceDoc?: string
}

interface AgentContext {
  mode: AppMode
  familyName?: string
}

function match(q: string, keywords: string[]): boolean {
  const lower = q.toLowerCase()
  return keywords.some((k) => lower.includes(k))
}

// Legacy = public family preview. Always uses the sample data (no signed-in user).
function legacyReply(message: string, familyName: string): AgentReply {
  const ownerFirst = owner.name.split(' ')[0]
  const p = samplePolicies.find((x) => x.type === 'term_life')!
  if (match(message, ['insurance', 'claim', 'policy', 'money', 'lic'])) {
    return {
      text: `Sure, ${familyName}. The primary policy on file is the LIC term life cover — policy number ${p.policyNumber}, sum assured ${p.coverageAmount}. You are the named nominee. The claim contact is ${p.claimContact}. ${ownerFirst} wanted you to have this information readily available. I can walk you through each step whenever you're ready.`,
      sourceDoc: 'LIC Term Life — Jeevan Amar',
    }
  }
  if (match(message, ['funeral', 'rites', 'wishes', 'last'])) {
    const ins = sampleInstructions.find((i) => i.type === 'funeral')!
    return {
      text: `${ownerFirst} wrote this down ahead of time: "${ins.body}"`,
      sourceDoc: 'Personal wishes',
    }
  }
  if (match(message, ['fund', 'account', 'savings', 'where'])) {
    const ins = sampleInstructions.find((i) => i.type === 'financial')!
    return {
      text: `Here's what ${ownerFirst} documented about finances: "${ins.body}" There's no pressure to act on anything quickly.`,
      sourceDoc: 'Financial instructions',
    }
  }
  if (match(message, ['message', 'say', 'note', 'me'])) {
    const ins = sampleInstructions.find((i) => i.type === 'messages')!
    return {
      text: `${ownerFirst} left a personal note: "${ins.body}"`,
      sourceDoc: 'Personal messages',
    }
  }
  return {
    text: `I'm here for whatever you need, ${familyName}. I can help you access documents, walk through insurance policies, show you where important accounts are, or share notes ${ownerFirst} left for you. What would be most helpful right now?`,
  }
}

export async function askAgent(
  message: string,
  context: AgentContext,
): Promise<AgentReply> {
  // The legacy preview is a public demo surface and always uses sample data.
  if (context.mode === 'legacy') {
    return legacyReply(message, context.familyName ?? 'Priya')
  }

  // Non-legacy: the Mastra agent reasons over the signed-in user's vault. No
  // session (e.g. the WhatsApp webhook) → tools return empty → the agent says so.
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

export const ownerName = owner.name
