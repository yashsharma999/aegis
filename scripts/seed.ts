// CLI: load the sample vault into an existing account.
//
//   pnpm db:seed you@example.com
//
// Sign up for the account first (new accounts start empty), then run this to
// populate it for a demo. dotenv is loaded before any DB module initializes.

import { config } from 'dotenv'

config({ path: '.env.local' })

async function main() {
  const email = process.argv[2]?.trim().toLowerCase()
  if (!email) {
    console.error('Usage: pnpm db:seed <email>')
    process.exit(1)
  }

  const { eq } = await import('drizzle-orm')
  const { db: orm } = await import('../lib/drizzle')
  const schema = await import('../lib/schema')
  const { seedVault } = await import('../lib/seed')

  const [u] = await orm
    .select({ id: schema.user.id, name: schema.user.name })
    .from(schema.user)
    .where(eq(schema.user.email, email))

  if (!u) {
    console.error(`No account found for "${email}". Sign up at /signup first, then re-run.`)
    process.exit(1)
  }

  await seedVault(u.id)
  console.log(`✅ Seeded the sample vault for ${u.name} <${email}>.`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
