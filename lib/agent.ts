// The agent brain (stubbed).
//
// TODO: replace with a Mastra multi-mode agent. Intents: retrieve, navigate_insurance,
// file_claim, track_expiry (proactive), emergency_medical, activate_legacy.
// Tools: searchDocuments(vector), getPolicies, getReminders, getMedicalProfile,
// getNextSteps, getContacts, markStepDone. RAG over Aurora pgvector.
// The active AppMode gates which tools/data are available.
//
// Non-legacy modes answer over the signed-in user's real vault (lib/db.ts).
// Legacy is the public family-preview demo and stays on the sample data.

import {
  instructions as sampleInstructions,
  owner,
  policies as samplePolicies,
} from './mock-data'
import { db } from './db'
import type { Document, MedicalProfile, Policy } from './types'
import type { AppMode } from './types'

export interface AgentReply {
  text: string
  sourceDoc?: string
}

interface AgentContext {
  mode: AppMode
  familyName?: string
}

interface VaultData {
  documents: Document[]
  policies: Policy[]
  medical: MedicalProfile
}

function match(q: string, keywords: string[]): boolean {
  const lower = q.toLowerCase()
  return keywords.some((k) => lower.includes(k))
}

function everydayReply(message: string, { documents, policies, medical }: VaultData): AgentReply {
  if (match(message, ['car', 'vehicle', 'motor', 'auto'])) {
    const p = policies.find((x) => x.type === 'vehicle')
    if (p) {
      return {
        text: `Your car insurance is with ${p.provider}, policy number ${p.policyNumber}. The renewal date on file is ${new Date(p.renewalDate).toLocaleDateString()}. Want me to draft a renewal reminder or pull up the claim contact (${p.claimContact})?`,
        sourceDoc: 'Car insurance',
      }
    }
  }
  if (match(message, ['passport', 'expire', 'expiry', 'travel'])) {
    const d = documents.find((x) => x.category === 'travel')
    if (d) {
      return {
        text: `Your passport is on file (${d.title}). If you have international travel planned, renew early — most visa applications require at least 6 months of validity. I can add a renewal task to your radar.`,
        sourceDoc: d.title,
      }
    }
  }
  if (match(message, ['network', 'hospital', 'cashless', 'admit'])) {
    const p = policies.find((x) => x.type === 'health')
    if (p && p.networkHospitals?.length) {
      return {
        text: `For cashless treatment under your ${p.provider} health policy (${p.policyNumber}), use one of your network hospitals: ${p.networkHospitals.join(', ')}. Show the policy number at the insurance desk and they'll raise a pre-authorisation.${medical.preferredHospital ? ` Your preferred hospital, ${medical.preferredHospital}, is listed.` : ''}`,
        sourceDoc: `${p.provider} health policy`,
      }
    }
  }
  if (match(message, ['claim', 'file a', 'reimburse'])) {
    const p = policies.find((x) => x.type === 'health')
    if (p && p.claimSteps?.length) {
      return {
        text: `Here's how to file a health claim with ${p.provider}:\n\n1. ${p.claimSteps.join('\n2. ')}\n\nClaim desk: ${p.claimContact}. Want me to pre-fill the claim intimation with your policy number ${p.policyNumber}?`,
        sourceDoc: `${p.provider} health policy`,
      }
    }
  }
  if (match(message, ['life', 'term', 'lic', 'premium'])) {
    const p = policies.find((x) => x.type === 'term_life')
    if (p) {
      return {
        text: `Your term life cover (${p.policyNumber}) has a sum assured of ${p.coverageAmount}. The premium is ${p.premium}, renewing ${new Date(p.renewalDate).toLocaleDateString()}. Keep it active so the cover doesn't lapse.`,
        sourceDoc: `${p.provider} term life`,
      }
    }
  }
  if (match(message, ['will', 'legal', 'executor'])) {
    const d = documents.find((x) => x.category === 'legal')
    if (d) {
      return {
        text: `Your will is stored in the Legal & Will section (${d.title}). ${d.notes} I'd suggest reviewing beneficiaries once a year.`,
        sourceDoc: d.title,
      }
    }
  }
  if (match(message, ['fund', 'money', 'investment', 'mutual', 'bank'])) {
    const d = documents.find((x) => x.category === 'financial')
    if (d) {
      return {
        text: `Your finances are tracked in Financial & Funds (${d.title}). ${d.notes} Want a quick summary of where everything sits?`,
        sourceDoc: d.title,
      }
    }
  }
  return {
    text: `I can help with that. I have everything in your vault — insurance policies, documents, renewals, medical info and your wishes. Try asking things like "When does my passport expire?", "Is Manipal in my health network?", or "Help me file a health claim."`,
  }
}

function emergencyReply(_message: string, { policies, medical }: VaultData): AgentReply {
  const p = policies.find((x) => x.type === 'health')
  const parts = [
    'Emergency info ready.',
    `Blood group ${medical.bloodGroup || 'not recorded'}.`,
  ]
  if (medical.allergies.length) {
    parts.push(`Severe allergy: ${medical.allergies.join(', ')} — do NOT administer.`)
  }
  if (p) {
    parts.push(`Active health cover: ${p.provider} ${p.policyNumber}.`)
  }
  if (medical.preferredHospital) {
    parts.push(`Cashless at ${medical.preferredHospital}.`)
  }
  parts.push('Show the policy number at admission.')
  return { text: parts.join(' '), sourceDoc: 'Emergency Medical ID' }
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
  // Simulate a little thinking latency.
  await new Promise((r) => setTimeout(r, 450))

  // The legacy preview is a public demo surface and always uses sample data.
  if (context.mode === 'legacy') {
    return legacyReply(message, context.familyName ?? 'Priya')
  }

  const [documents, policies, medical] = await Promise.all([
    db.getDocuments(),
    db.getPolicies(),
    db.getMedicalProfile(),
  ])

  // An empty vault has nothing to retrieve from.
  if (documents.length === 0 && policies.length === 0) {
    return {
      text: "Your vault is empty right now, so there's nothing for me to pull from yet. Add your documents, insurance policies, medical details and wishes, and I'll be able to answer questions and point you straight to the source.",
    }
  }

  const data: VaultData = { documents, policies, medical }
  switch (context.mode) {
    case 'emergency':
      return emergencyReply(message, data)
    case 'incapacity':
    case 'everyday':
    default:
      return everydayReply(message, data)
  }
}

export const ownerName = owner.name
