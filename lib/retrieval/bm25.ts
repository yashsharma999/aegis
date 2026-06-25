// Hand-rolled Okapi BM25 over a user's document chunks.
//
// Retrieval is always user-scoped (a few hundred chunks per user), so there's no
// need for a BM25 index/extension: load the user's chunks and score in-memory.
// Real IDF + k1 term-frequency saturation + b length-normalization — the gaps
// that make Postgres ts_rank unsuitable for identifier-heavy documents.
//
//   idf  = ln((N - df + 0.5) / (df + 0.5) + 1)
//   score = Σ_term  idf * (tf*(k1+1)) / (tf + k1*(1 - b + b*len/avgLen))
//
// This is the single retrieval seam; a dense (pgvector) retriever fuses here via
// RRF in the hybrid phase. k1/b are exposed so the eval harness can tune them.

import { and, eq } from 'drizzle-orm'
import { db as orm } from '../drizzle'
import * as schema from '../schema'

const STOPWORDS = new Set(
  'a an the of and or to in on for with is are was were be been being at by from as this that these those it its your you we our i me my he she they them his her their'.split(
    ' ',
  ),
)

function stem(t: string): string {
  // Light: collapse simple plurals so "hospitals" matches "hospital".
  if (t.length > 3 && t.endsWith('s') && !t.endsWith('ss')) return t.slice(0, -1)
  return t
}

export function tokenize(text: string): string[] {
  const raw = text.toLowerCase().match(/[a-z0-9]+/g) ?? []
  return raw.filter((t) => t.length > 1 && !STOPWORDS.has(t)).map(stem)
}

export interface ScorableChunk {
  id: string
  documentId: string
  content: string
  title?: string
}

export interface RankedChunk {
  chunkId: string
  documentId: string
  title?: string
  score: number
  snippet: string
}

function snippetOf(content: string, max = 240): string {
  const s = content.replace(/\s+/g, ' ').trim()
  return s.length > max ? `${s.slice(0, max)}…` : s
}

export function scoreBM25(
  chunks: ScorableChunk[],
  query: string,
  opts: { k1?: number; b?: number } = {},
): RankedChunk[] {
  const k1 = opts.k1 ?? 1.5
  const b = opts.b ?? 0.75
  const qTerms = [...new Set(tokenize(query))]
  if (qTerms.length === 0 || chunks.length === 0) return []

  const docs = chunks.map((c) => ({ chunk: c, tokens: tokenize(c.content) }))
  const N = docs.length
  const avgLen = docs.reduce((s, d) => s + d.tokens.length, 0) / N || 1

  // Document frequency per query term.
  const df = new Map<string, number>()
  for (const term of qTerms) {
    let n = 0
    for (const d of docs) if (d.tokens.includes(term)) n++
    df.set(term, n)
  }

  const ranked = docs.map(({ chunk, tokens }) => {
    const len = tokens.length || 1
    const tf = new Map<string, number>()
    for (const tok of tokens) tf.set(tok, (tf.get(tok) ?? 0) + 1)

    let score = 0
    for (const term of qTerms) {
      const f = tf.get(term) ?? 0
      if (f === 0) continue
      const n = df.get(term) ?? 0
      const idf = Math.log((N - n + 0.5) / (n + 0.5) + 1)
      score += (idf * (f * (k1 + 1))) / (f + k1 * (1 - b + (b * len) / avgLen))
    }

    return {
      chunkId: chunk.id,
      documentId: chunk.documentId,
      title: chunk.title,
      score,
      snippet: snippetOf(chunk.content),
    }
  })

  return ranked.filter((r) => r.score > 0).sort((a, b) => b.score - a.score)
}

export interface DocHit {
  documentId: string
  title?: string
  score: number
  bestChunkId: string
  snippet: string
}

export interface SearchResult {
  chunks: RankedChunk[]
  documents: DocHit[]
}

export async function searchDocuments(
  userId: string,
  query: string,
  opts: { limit?: number; k1?: number; b?: number } = {},
): Promise<SearchResult> {
  const limit = opts.limit ?? 6

  const rows = await orm
    .select({
      id: schema.documentChunk.id,
      documentId: schema.documentChunk.documentId,
      content: schema.documentChunk.content,
      title: schema.document.title,
    })
    .from(schema.documentChunk)
    .innerJoin(
      schema.document,
      and(
        eq(schema.document.userId, schema.documentChunk.userId),
        eq(schema.document.id, schema.documentChunk.documentId),
      ),
    )
    .where(eq(schema.documentChunk.userId, userId))

  const ranked = scoreBM25(
    rows.map((r) => ({
      id: r.id,
      documentId: r.documentId,
      content: r.content,
      title: r.title ?? undefined,
    })),
    query,
    opts,
  )

  // Document-level rollup: each document keeps its best chunk score.
  const byDoc = new Map<string, DocHit>()
  for (const r of ranked) {
    const cur = byDoc.get(r.documentId)
    if (!cur || r.score > cur.score) {
      byDoc.set(r.documentId, {
        documentId: r.documentId,
        title: r.title,
        score: r.score,
        bestChunkId: r.chunkId,
        snippet: r.snippet,
      })
    }
  }
  const documents = [...byDoc.values()].sort((a, b) => b.score - a.score).slice(0, limit)

  return { chunks: ranked.slice(0, limit), documents }
}
