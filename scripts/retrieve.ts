// CLI: BM25 search over a user's document chunks.
//
//   pnpm retrieve <email> "<query>"        [--k1=1.5] [--b=0.75] [--limit=6]
//
// Prints ranked documents and the best-matching chunk snippets with scores.

import { config } from 'dotenv'

config({ path: '.env.local' })

function flag(name: string, fallback: number): number {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? Number(hit.split('=')[1]) : fallback
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const email = args[0]?.trim().toLowerCase()
  const query = args.slice(1).join(' ').trim()
  if (!email || !query) {
    console.error('Usage: pnpm retrieve <email> "<query>" [--k1=1.5] [--b=0.75] [--limit=6]')
    process.exit(1)
  }

  const { eq } = await import('drizzle-orm')
  const { db: orm } = await import('../lib/drizzle')
  const schema = await import('../lib/schema')
  const { searchDocuments } = await import('../lib/retrieval/bm25')

  const [u] = await orm
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.email, email))
  if (!u) {
    console.error(`No account found for "${email}".`)
    process.exit(1)
  }

  const limit = flag('limit', 6)
  const result = await searchDocuments(u.id, query, {
    limit,
    k1: flag('k1', 1.5),
    b: flag('b', 0.75),
  })

  console.log(`\nQuery: "${query}"  (k1=${flag('k1', 1.5)}, b=${flag('b', 0.75)})\n`)
  if (result.documents.length === 0) {
    console.log('No matches. (Empty vault, or no lexical overlap — the case for hybrid.)')
    process.exit(0)
  }

  console.log('Top documents:')
  result.documents.forEach((d, i) => {
    console.log(`  ${i + 1}. [${d.score.toFixed(3)}] ${d.title ?? d.documentId}`)
  })
  console.log('\nTop chunks:')
  result.chunks.forEach((c, i) => {
    console.log(`  ${i + 1}. [${c.score.toFixed(3)}] ${c.title ?? c.documentId} — ${c.chunkId}`)
    console.log(`     ${c.snippet}`)
  })
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
