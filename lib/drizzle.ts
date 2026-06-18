// Drizzle client over a node-postgres Pool.
//
// This is the low-level database connection. The Better Auth Drizzle adapter
// (lib/auth.ts) and — in a later phase — the vault/RAG data layer both build on
// this single `db` instance and the shared schema in lib/schema.ts.
//
// Pool creation is lazy: no connection is opened until the first query, so this
// module is safe to import in tooling (drizzle-kit, the Better Auth CLI) even
// before DATABASE_URL points at a live database.

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

// Reuse the pool across hot reloads in development to avoid exhausting connections.
const globalForDb = globalThis as unknown as { __aegisPool?: Pool }

const pool = globalForDb.__aegisPool ?? new Pool({ connectionString })
if (process.env.NODE_ENV !== 'production') globalForDb.__aegisPool = pool

export const db = drizzle(pool, { schema })
