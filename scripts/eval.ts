// CLI: measure BM25 retrieval quality against expected documents.
//
//   pnpm eval <email> [cases.json]
//
// cases.json: [{ "query": "...", "expect": "<substring of the doc title>" }, ...]
// Falls back to a few inline insurance cases if no file is given. Prints hit@1 /
// hit@3 and per-query results — the baseline to compare a future hybrid retriever.

import { config } from 'dotenv'
import { readFileSync } from 'node:fs'

config({ path: '.env.local' })

interface Case {
  query: string
  expect: string // case-insensitive substring expected in the matched document title
}

const DEFAULT_CASES: Case[] = [
  { query: 'cashless network hospitals', expect: 'health' },
  { query: 'term life sum assured nominee', expect: 'life' },
  { query: 'health insurance policy number', expect: 'health' },
  { query: 'premium renewal date', expect: 'policy' },
]

async function main() {
  const args = process.argv.slice(2)
  const email = args[0]?.trim().toLowerCase()
  if (!email) {
    console.error('Usage: pnpm eval <email> [cases.json]')
    process.exit(1)
  }
  const cases: Case[] = args[1]
    ? (JSON.parse(readFileSync(args[1], 'utf8')) as Case[])
    : DEFAULT_CASES

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

  let hit1 = 0
  let hit3 = 0
  console.log(`\nEvaluating ${cases.length} queries for ${email}:\n`)

  for (const c of cases) {
    const { documents } = await searchDocuments(u.id, c.query, { limit: 3 })
    const titles = documents.map((d) => (d.title ?? '').toLowerCase())
    const want = c.expect.toLowerCase()
    const at1 = titles[0]?.includes(want) ?? false
    const at3 = titles.some((t) => t.includes(want))
    if (at1) hit1++
    if (at3) hit3++
    const mark = at1 ? '✓@1' : at3 ? '~@3' : '✗  '
    console.log(`  ${mark}  "${c.query}"  → ${documents[0]?.title ?? '(none)'}`)
  }

  const n = cases.length
  console.log(`\nhit@1: ${hit1}/${n} (${((hit1 / n) * 100).toFixed(0)}%)   hit@3: ${hit3}/${n} (${((hit3 / n) * 100).toFixed(0)}%)\n`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
