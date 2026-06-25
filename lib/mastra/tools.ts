// Tools the vault agent can call. All read-only and user-scoped.
//
// userId comes from requestContext (set by the Mastra server's header
// middleware, or by the embedded caller). Tools never touch the Next session,
// so they work in the standalone Mastra server.

import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { searchDocuments } from '../retrieval/bm25'
import { getPublicUrl, getSignedDownloadUrl } from '../storage'
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
    results: z.array(
      z.object({ documentId: z.string(), source: z.string(), snippet: z.string(), score: z.number() }),
    ),
  }),
  execute: async (input, ctx) => {
    const id = userId(ctx)
    if (!id) return { results: [] }
    // Return the best match PER DOCUMENT (not raw top chunks) so a large document
    // can't bury a small one — every matching document surfaces once.
    const { documents } = await searchDocuments(id, input.query, { limit: input.limit ?? 6 })
    return {
      results: documents.map((d) => ({
        documentId: d.documentId,
        source: d.title ?? 'Untitled',
        snippet: d.snippet,
        score: d.score,
      })),
    }
  },
})

// Roughly ~30k tokens of text; beyond this, steer back to searchVault.
const MAX_READ_CHARS = 120_000

export const readDocument = createTool({
  id: 'readDocument',
  description:
    "Read the FULL text of one document end-to-end. Use this when the user wants the whole document read, summarized, or listed (e.g. 'read the claim form and tell me everything I need to fill') — NOT for finding a single fact (use searchVault for that). Pass the documentId from a search-vault result.",
  inputSchema: z.object({
    documentId: z.string().describe('The documentId returned by search-vault.'),
  }),
  outputSchema: z.object({
    title: z.string().nullable(),
    text: z.string().nullable(),
    truncated: z.boolean().optional(),
    note: z.string().optional(),
  }),
  execute: async (input, ctx) => {
    const id = userId(ctx)
    if (!id) return { title: null, text: null, note: 'Not signed in.' }
    const doc = await vaultFor(id).documentById(input.documentId)
    if (!doc) return { title: null, text: null, note: 'That document is not in your vault.' }
    const full = await vaultFor(id).documentFullText(input.documentId)
    if (!full) {
      return {
        title: doc.title,
        text: null,
        note: 'No readable text in this document (it may be a scanned image).',
      }
    }
    if (full.length > MAX_READ_CHARS) {
      return {
        title: doc.title,
        text: full.slice(0, MAX_READ_CHARS),
        truncated: true,
        note: 'This document is large and was truncated. Use searchVault for specific details.',
      }
    }
    return { title: doc.title, text: full }
  },
})

export const getDocumentLink = createTool({
  id: 'getDocumentLink',
  description:
    "Get a temporary, openable link to a specific document the user wants to view or download. Pass the documentId from a search-vault result (run search-vault first if you don't have one). Returns an https URL valid for ~1 hour; share it as a markdown link.",
  inputSchema: z.object({
    documentId: z.string().describe('The documentId returned by search-vault.'),
  }),
  outputSchema: z.object({
    title: z.string().nullable(),
    url: z.string().nullable(),
    note: z.string().optional(),
  }),
  execute: async (input, ctx) => {
    const id = userId(ctx)
    if (!id) return { title: null, url: null, note: 'Not signed in.' }
    const doc = await vaultFor(id).documentById(input.documentId)
    if (!doc) return { title: null, url: null, note: 'That document is not in your vault.' }
    if (doc.kind === 'note') {
      return {
        title: doc.title,
        url: null,
        note: 'This is an authored note, not a downloadable file. Use readDocument to read its full text and share that.',
      }
    }
    if (!doc.storageKey) {
      return { title: doc.title, url: null, note: 'This document has no uploaded file attached.' }
    }
    try {
      // Prefer the permanent public URL (public bucket); else a signed URL.
      const url = getPublicUrl(doc.storageKey) ?? (await getSignedDownloadUrl(doc.storageKey, 3600))
      return { title: doc.title, url }
    } catch {
      return { title: doc.title, url: null, note: 'Could not generate a link (storage not configured).' }
    }
  },
})

export const getReminders = createTool({
  id: 'getReminders',
  description: 'Upcoming renewals/expiries/premiums derived from the vault documents, with due dates and status (scheduled, due_soon, overdue).',
  inputSchema: z.object({}),
  outputSchema: z.object({ reminders: z.array(z.any()) }),
  execute: async (_input, ctx) => {
    const id = userId(ctx)
    return { reminders: id ? await vaultFor(id).reminders() : [] }
  },
})

export const getContacts = createTool({
  id: 'getContacts',
  description:
    "The user's key people (doctor, lawyer, bank relationship manager, etc.) with phone numbers and notes. Use for questions like 'who is my lawyer' or 'call my doctor'.",
  inputSchema: z.object({}),
  outputSchema: z.object({ contacts: z.array(z.any()) }),
  execute: async (_input, ctx) => {
    const id = userId(ctx)
    return { contacts: id ? await vaultFor(id).contacts() : [] }
  },
})

// The agent is context-centric: its knowledge is the user's vault items —
// uploaded files AND authored markdown notes (wishes/instructions) — all
// chunked and reachable via searchVault/readDocument/getDocumentLink, plus
// structured contacts (getContacts) and document-derived reminders.
// Credentials are deliberately NOT exposed here — they are shielded from the
// agent (separate table, never indexed, no tool).
export const allTools = {
  searchVault,
  readDocument,
  getDocumentLink,
  getReminders,
  getContacts,
}
