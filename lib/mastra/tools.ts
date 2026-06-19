// Tools the vault agent can call. All read-only and user-scoped.
//
// userId comes from requestContext (set by the Mastra server's header
// middleware, or by the embedded caller). Tools never touch the Next session,
// so they work in the standalone Mastra server.

import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { searchDocuments } from '../retrieval/bm25'
import { vaultFor } from './vault'

function userId(ctx: { requestContext?: { get(k: string): unknown } }): string | null {
  const v = ctx.requestContext?.get('userId')
  return typeof v === 'string' && v ? v : null
}

export const searchVault = createTool({
  id: 'searchVault',
  description:
    "Full-text (BM25) search across the user's uploaded documents (policies, statements, forms). Use for any question whose answer is in the document text — exact clauses, numbers, hospital lists, claim steps. Returns matching snippets with the source document title. Always cite the source title.",
  inputSchema: z.object({
    query: z.string().describe('Keywords or a natural-language query.'),
    limit: z.number().int().min(1).max(10).optional(),
  }),
  outputSchema: z.object({
    results: z.array(z.object({ source: z.string(), snippet: z.string(), score: z.number() })),
  }),
  execute: async (input, ctx) => {
    const id = userId(ctx)
    if (!id) return { results: [] }
    const { chunks } = await searchDocuments(id, input.query, { limit: input.limit ?? 6 })
    return { results: chunks.map((c) => ({ source: c.title ?? 'Untitled', snippet: c.snippet, score: c.score })) }
  },
})

export const getPolicies = createTool({
  id: 'getPolicies',
  description: "List the user's insurance policies (provider, number, coverage, premium, renewal date, claim contact/steps, network hospitals).",
  inputSchema: z.object({}),
  outputSchema: z.object({ policies: z.array(z.any()) }),
  execute: async (_input, ctx) => {
    const id = userId(ctx)
    return { policies: id ? await vaultFor(id).policies() : [] }
  },
})

export const getReminders = createTool({
  id: 'getReminders',
  description: 'Upcoming renewals/expiries/premiums derived from the vault, with due dates and status (scheduled, due_soon, overdue).',
  inputSchema: z.object({}),
  outputSchema: z.object({ reminders: z.array(z.any()) }),
  execute: async (_input, ctx) => {
    const id = userId(ctx)
    return { reminders: id ? await vaultFor(id).reminders() : [] }
  },
})

export const getMedicalProfile = createTool({
  id: 'getMedicalProfile',
  description: "The user's medical profile: blood group, allergies, medications, conditions, active health policy, preferred hospital, emergency note.",
  inputSchema: z.object({}),
  outputSchema: z.object({ medical: z.any() }),
  execute: async (_input, ctx) => {
    const id = userId(ctx)
    return { medical: id ? await vaultFor(id).medical() : null }
  },
})

export const getContacts = createTool({
  id: 'getContacts',
  description: 'Key contacts (doctor, lawyer, bank relationship manager, etc.) with phone numbers and notes.',
  inputSchema: z.object({}),
  outputSchema: z.object({ contacts: z.array(z.any()) }),
  execute: async (_input, ctx) => {
    const id = userId(ctx)
    return { contacts: id ? await vaultFor(id).contacts() : [] }
  },
})

export const getBeneficiaries = createTool({
  id: 'getBeneficiaries',
  description: 'People who can access the vault (beneficiaries) with relationship, access scope, and verification status.',
  inputSchema: z.object({}),
  outputSchema: z.object({ beneficiaries: z.array(z.any()) }),
  execute: async (_input, ctx) => {
    const id = userId(ctx)
    return { beneficiaries: id ? await vaultFor(id).beneficiaries() : [] }
  },
})

export const getInstructions = createTool({
  id: 'getInstructions',
  description: "The owner's written wishes and instructions (first 24 hours, funeral, personal messages, financial guidance).",
  inputSchema: z.object({}),
  outputSchema: z.object({ instructions: z.array(z.any()) }),
  execute: async (_input, ctx) => {
    const id = userId(ctx)
    return { instructions: id ? await vaultFor(id).instructions() : [] }
  },
})

export const allTools = {
  searchVault,
  getPolicies,
  getReminders,
  getMedicalProfile,
  getContacts,
  getBeneficiaries,
  getInstructions,
}
