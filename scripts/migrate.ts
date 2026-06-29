// CLI: apply drizzle/ migrations to whatever DATABASE_URL points at.
//
//   pnpm db:migrate
//
// Replaces `drizzle-kit migrate`, whose migrate command hangs against Aurora
// with our TLS config. This drives drizzle-orm's migrator directly over a pg
// Pool built from the same DATABASE_URL + DATABASE_SSL policy as the app
// (lib/pg-ssl.ts), so it behaves identically on local Docker and Aurora.
// Migrations are tracked, so re-running is a no-op once everything is applied.
//
// dotenv is loaded before any DB module initializes.

import { config } from 'dotenv'

config({ path: '.env.local' })

async function main() {
  const { Pool } = await import('pg')
  const { drizzle } = await import('drizzle-orm/node-postgres')
  const { migrate } = await import('drizzle-orm/node-postgres/migrator')
  const { pgSsl } = await import('../lib/pg-ssl')

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set (check .env.local).')
    process.exit(1)
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: pgSsl() })
  try {
    await migrate(drizzle(pool), { migrationsFolder: './drizzle' })
    console.log('Migrations applied.')
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
