// Mastra storage + memory, backed by the same Postgres as the vault.
// Persists conversation threads (resource = userId, thread = conversation) so
// the assistant remembers prior turns and the sidebar can list past chats.

import { PostgresStore } from '@mastra/pg'
import { Memory } from '@mastra/memory'
import { vaultModel } from './model'

export const storage = new PostgresStore({
  id: 'aegis',
  connectionString: process.env.DATABASE_URL ?? '',
})

export const memory = new Memory({
  storage,
  options: {
    lastMessages: 20,
    // Semantic recall needs a vector store; thread history alone is enough here.
    semanticRecall: false,
    // Auto-name threads for the sidebar (one cheap title call per new thread).
    generateTitle: {
      model: vaultModel,
      instructions:
        "You are a title generator. Output ONLY a 3-to-6 word title summarizing the user's first question. No quotes, no trailing punctuation, no preamble, no explanation — just the title text.",
    },
  },
})
