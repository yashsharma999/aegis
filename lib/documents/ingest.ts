// Vault-item ingestion. Two entry points feed one core indexer:
//   ingestFile — an uploaded file (PDF parsed to text; image stored as-is)
//   ingestNote — free-form markdown authored in-app
// The core writes one `document` row + N `document_chunk` rows in a transaction.
// Chunks are what BM25/the agent retrieve, so every item — file or note — is
// indexed the same way. Reused by the upload/note server actions and the CLIs.

import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { db as orm } from '../drizzle'
import * as schema from '../schema'
import { putObject } from '../storage'
import { tokenize } from '../retrieval/bm25'
import { extractText } from './parse'
import { chunkText } from './chunk'

export interface IngestResult {
  documentId: string
  chunkCount: number
  pageCount: number
}

// ── Core: persist a document row + its chunks ────────────────────────────────

interface IndexItemInput {
  userId: string
  documentId: string
  kind: 'file' | 'note'
  category: string
  title: string
  text: string // the text to chunk + index (PDF text, note markdown, or title+notes)
  body?: string | null // markdown source kept for round-trip note editing
  fileName?: string | null
  notes?: string
  sensitive?: boolean
  storageKey?: string | null
  mimeType?: string | null
  sizeBytes?: number | null
  pageCount?: number | null
}

async function indexItem(input: IndexItemInput): Promise<IngestResult> {
  const chunks = chunkText(input.text)
  const now = new Date().toISOString()

  await orm.transaction(async (tx) => {
    await tx.insert(schema.document).values({
      userId: input.userId,
      id: input.documentId,
      kind: input.kind,
      category: input.category,
      title: input.title,
      fileName: input.fileName ?? null,
      body: input.body ?? null,
      notes: input.notes ?? '',
      sensitive: input.sensitive ?? false,
      uploadedAt: now,
      updatedAt: now,
      storageKey: input.storageKey ?? null,
      mimeType: input.mimeType ?? null,
      sizeBytes: input.sizeBytes ?? null,
      pageCount: input.pageCount ?? null,
      status: 'ready',
    })
    if (chunks.length > 0) {
      await tx.insert(schema.documentChunk).values(
        chunks.map((c) => ({
          userId: input.userId,
          id: `${input.documentId}#${c.index}`,
          documentId: input.documentId,
          chunkIndex: c.index,
          content: c.content,
          tokenCount: tokenize(c.content).length,
        })),
      )
    }
  })

  return { documentId: input.documentId, chunkCount: chunks.length, pageCount: input.pageCount ?? 0 }
}

// ── Files (PDF parsed; image/other stored, title+notes indexed) ──────────────

export interface IngestFileInput {
  userId: string
  bytes: Uint8Array
  fileName: string
  mimeType?: string
  category: string
  title?: string
  notes?: string
  sensitive?: boolean
  password?: string
}

function extOf(fileName: string, mimeType: string): string {
  const m = /\.[a-z0-9]+$/i.exec(fileName)
  if (m) return m[0].toLowerCase()
  if (mimeType === 'application/pdf') return '.pdf'
  if (mimeType.startsWith('image/')) return `.${mimeType.slice('image/'.length)}`
  return ''
}

export async function ingestFile(input: IngestFileInput): Promise<IngestResult> {
  const documentId = randomUUID()
  const mimeType = input.mimeType ?? 'application/pdf'
  const isPdf = mimeType === 'application/pdf' || /\.pdf$/i.test(input.fileName)
  const title = input.title?.trim() || input.fileName.replace(/\.[^.]+$/, '')

  // PDFs get parsed to text (a PdfPasswordError aborts before any write).
  // Images/other have no extractable text — we index title + notes so they're
  // still findable, and store the file for viewing/linking.
  let text: string
  let pageCount = 0
  if (isPdf) {
    const parsed = await extractText(input.bytes, { password: input.password })
    text = parsed.text
    pageCount = parsed.pageCount
  } else {
    text = [title, input.notes].filter(Boolean).join('\n')
  }

  const storageKey = `${input.userId}/${documentId}${extOf(input.fileName, mimeType)}`
  await putObject(storageKey, input.bytes, mimeType)

  return indexItem({
    userId: input.userId,
    documentId,
    kind: 'file',
    category: input.category,
    title,
    text,
    fileName: input.fileName,
    notes: input.notes,
    sensitive: input.sensitive,
    storageKey,
    mimeType,
    sizeBytes: input.bytes.byteLength,
    pageCount,
  })
}

// ── Notes (markdown authored in-app) ─────────────────────────────────────────

export interface IngestNoteInput {
  userId: string
  category: string
  title: string
  body: string // markdown
  notes?: string
  sensitive?: boolean
}

export async function ingestNote(input: IngestNoteInput): Promise<IngestResult> {
  const documentId = randomUUID()
  return indexItem({
    userId: input.userId,
    documentId,
    kind: 'note',
    category: input.category,
    title: input.title.trim() || 'Untitled note',
    text: input.body,
    body: input.body,
    notes: input.notes,
    sensitive: input.sensitive,
    mimeType: 'text/markdown',
  })
}

export interface ReindexNoteInput {
  userId: string
  documentId: string
  title: string
  category: string
  body: string
  notes?: string
  sensitive?: boolean
}

// Re-author an existing note: replace its chunks and update the row in one txn.
export async function reindexNote(input: ReindexNoteInput): Promise<IngestResult> {
  const chunks = chunkText(input.body)
  const now = new Date().toISOString()

  await orm.transaction(async (tx) => {
    await tx
      .delete(schema.documentChunk)
      .where(
        and(
          eq(schema.documentChunk.userId, input.userId),
          eq(schema.documentChunk.documentId, input.documentId),
        ),
      )
    await tx
      .update(schema.document)
      .set({
        title: input.title.trim() || 'Untitled note',
        category: input.category,
        body: input.body,
        notes: input.notes ?? '',
        sensitive: input.sensitive ?? false,
        updatedAt: now,
      })
      .where(and(eq(schema.document.userId, input.userId), eq(schema.document.id, input.documentId)))
    if (chunks.length > 0) {
      await tx.insert(schema.documentChunk).values(
        chunks.map((c) => ({
          userId: input.userId,
          id: `${input.documentId}#${c.index}`,
          documentId: input.documentId,
          chunkIndex: c.index,
          content: c.content,
          tokenCount: tokenize(c.content).length,
        })),
      )
    }
  })

  return { documentId: input.documentId, chunkCount: chunks.length, pageCount: 0 }
}

// Backwards-compatible alias for the original PDF-only entry point.
export const ingestDocument = ingestFile
