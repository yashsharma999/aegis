// The agent brain (stubbed).
//
// TODO: replace with a Mastra multi-mode agent. Intents: retrieve, navigate_insurance,
// file_claim, track_expiry (proactive), emergency_medical, activate_legacy.
// Tools: searchDocuments(vector), getPolicies, getReminders, getMedicalProfile,
// getNextSteps, getContacts, markStepDone. RAG over Aurora pgvector.
// The active AppMode gates which tools/data are available.

import {
  documents,
  instructions,
  medicalProfile,
  owner,
  policies,
} from './mock-data'
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

function everydayReply(message: string): AgentReply {
  if (match(message, ['car', 'vehicle', 'motor', 'auto'])) {
    const p = policies.find((x) => x.type === 'vehicle')!
    return {
      text: `Your car insurance is with ${p.provider}, policy number ${p.policyNumber}. Heads up — the renewal was due ${new Date(p.renewalDate).toLocaleDateString()} and is currently overdue, so the Honda City is uninsured right now. Want me to draft a renewal reminder or pull up the claim contact (${p.claimContact})?`,
      sourceDoc: 'Car Registration — Honda City',
    }
  }
  if (match(message, ['passport', 'expire', 'expiry', 'travel'])) {
    const d = documents.find((x) => x.category === 'travel')!
    return {
      text: `Your passport is on file and is set to expire in about 3 months. If you have any international travel planned, I'd renew now — most visa applications require at least 6 months of validity. I can add a renewal task to your radar.`,
      sourceDoc: d.title,
    }
  }
  if (match(message, ['network', 'hospital', 'cashless', 'admit'])) {
    const p = policies.find((x) => x.type === 'health')!
    return {
      text: `For cashless treatment under your ${p.provider} health policy (${p.policyNumber}), use one of your network hospitals: ${p.networkHospitals?.join(', ')}. Show the policy number at the insurance desk and they'll raise a pre-authorisation. Your preferred hospital, ${medicalProfile.preferredHospital}, is in network.`,
      sourceDoc: 'HDFC Ergo Family Health Policy',
    }
  }
  if (match(message, ['claim', 'file a', 'reimburse'])) {
    const p = policies.find((x) => x.type === 'health')!
    return {
      text: `Here's how to file a health claim with ${p.provider}:\n\n1. ${p.claimSteps?.join('\n2. ')}\n\nClaim desk: ${p.claimContact}. Want me to pre-fill the claim intimation with your policy number ${p.policyNumber}?`,
      sourceDoc: 'HDFC Ergo Family Health Policy',
    }
  }
  if (match(message, ['life', 'term', 'lic', 'premium'])) {
    const p = policies.find((x) => x.type === 'term_life')!
    return {
      text: `Your LIC term life cover (${p.policyNumber}) has a sum assured of ${p.coverageAmount}. The premium of ${p.premium.split('/')[0].trim()} is due in about 10 days — I'd recommend paying it to keep the cover active. Priya is the nominee.`,
      sourceDoc: 'LIC Term Life — Jeevan Amar',
    }
  }
  if (match(message, ['will', 'legal', 'executor'])) {
    const d = documents.find((x) => x.category === 'legal')!
    return {
      text: `Your registered will is stored in the Legal & Will section. The named executor is your brother, Arjun Sharma. Everything is in order — I'd just suggest reviewing beneficiaries once a year.`,
      sourceDoc: d.title,
    }
  }
  if (match(message, ['fund', 'money', 'investment', 'mutual', 'bank'])) {
    const d = documents.find((x) => x.category === 'financial')!
    return {
      text: `Your funds are tracked in Financial & Funds: a consolidated CAMS mutual fund statement plus the HDFC savings account. Priya is the nominee on all folios. Want a quick summary of where everything sits?`,
      sourceDoc: d.title,
    }
  }
  return {
    text: `I can help with that. I have everything in your vault — insurance policies, documents, renewals, medical info and your wishes. Try asking things like "When does my passport expire?", "Is Manipal in my health network?", or "Help me file a health claim."`,
  }
}

function legacyReply(message: string, familyName: string): AgentReply {
  const ownerFirst = owner.name.split(' ')[0]
  const p = policies.find((x) => x.type === 'term_life')!
  if (match(message, ['insurance', 'claim', 'policy', 'money', 'lic'])) {
    return {
      text: `Sure, ${familyName}. The primary policy on file is the LIC term life cover — policy number ${p.policyNumber}, sum assured ${p.coverageAmount}. You are the named nominee. The claim contact is ${p.claimContact}. ${ownerFirst} wanted you to have this information readily available. I can walk you through each step whenever you're ready.`,
      sourceDoc: 'LIC Term Life — Jeevan Amar',
    }
  }
  if (match(message, ['funeral', 'rites', 'wishes', 'last'])) {
    const ins = instructions.find((i) => i.type === 'funeral')!
    return {
      text: `${ownerFirst} wrote this down ahead of time: "${ins.body}"`,
      sourceDoc: 'Personal wishes',
    }
  }
  if (match(message, ['fund', 'account', 'savings', 'where'])) {
    const ins = instructions.find((i) => i.type === 'financial')!
    return {
      text: `Here's what ${ownerFirst} documented about finances: "${ins.body}" There's no pressure to act on anything quickly.`,
      sourceDoc: 'Financial instructions',
    }
  }
  if (match(message, ['message', 'say', 'note', 'me'])) {
    const ins = instructions.find((i) => i.type === 'messages')!
    return {
      text: `${ownerFirst} left a personal note: "${ins.body}"`,
      sourceDoc: 'Personal messages',
    }
  }
  return {
    text: `I'm here for whatever you need, ${familyName}. I can help you access documents, walk through insurance policies, show you where important accounts are, or share notes ${ownerFirst} left for you. What would be most helpful right now?`,
  }
}

function emergencyReply(message: string): AgentReply {
  const p = policies.find((x) => x.type === 'health')!
  return {
    text: `Emergency info ready. Blood group ${medicalProfile.bloodGroup}. Severe allergy: ${medicalProfile.allergies.join(', ')} — do NOT administer. Active health cover: ${p.provider} ${p.policyNumber}, cashless at ${medicalProfile.preferredHospital}. Primary contact: Priya. Show this policy number at admission.`,
    sourceDoc: 'Emergency Medical ID',
  }
}

export async function askAgent(
  message: string,
  context: AgentContext,
): Promise<AgentReply> {
  // Simulate a little thinking latency.
  await new Promise((r) => setTimeout(r, 450))

  switch (context.mode) {
    case 'legacy':
      return legacyReply(message, context.familyName ?? 'Priya')
    case 'emergency':
      return emergencyReply(message)
    case 'incapacity':
      return everydayReply(message)
    case 'everyday':
    default:
      return everydayReply(message)
  }
}

export const ownerName = owner.name
