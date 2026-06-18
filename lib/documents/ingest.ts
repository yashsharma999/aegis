// Document ingestion: store original in object storage → parse → chunk →
// persist one `document` row + N `document_chunk` rows in a transaction.
// Reused by the upload server action AND the CLI scripts.

import { randomUUID } from 'node:crypto'
import { db as orm } from '../drizzle'
import * as schema from '../schema'
import { putObject } from '../storage'
import { tokenize } from '../retrieval/bm25'
import { extractText } from './parse'
import { chunkText } from './chunk'

export interface IngestInput {
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

export interface IngestResult {
  documentId: string
  chunkCount: number
  pageCount: number
}

export async function ingestDocument(input: IngestInput): Promise<IngestResult> {
  const documentId = randomUUID()
  const mimeType = input.mimeType ?? 'application/pdf'

  // Parse first: a PdfPasswordError aborts here, before any upload or DB write.
  const { text, pageCount } = await extractText(input.bytes, { password: input.password })
  const chunks = chunkText(text)

  // Store the original (still-encrypted if it was) in object storage.
  const storageKey = `${input.userId}/${documentId}.pdf`
  await putObject(storageKey, input.bytes, mimeType)

  const title = input.title?.trim() || input.fileName.replace(/\.[^.]+$/, '')
  const now = new Date().toISOString()

  await orm.transaction(async (tx) => {
    await tx.insert(schema.document).values({
      userId: input.userId,
      id: documentId,
      category: input.category,
      title,
      fileName: input.fileName,
      notes: input.notes ?? '',
      sensitive: input.sensitive ?? false,
      uploadedAt: now,
      storageKey,
      mimeType,
      sizeBytes: input.bytes.byteLength,
      pageCount,
      status: 'ready',
    })
    if (chunks.length > 0) {
      await tx.insert(schema.documentChunk).values(
        chunks.map((c) => ({
          userId: input.userId,
          id: `${documentId}#${c.index}`,
          documentId,
          chunkIndex: c.index,
          content: c.content,
          tokenCount: tokenize(c.content).length,
        })),
      )
    }
  })

  return { documentId, chunkCount: chunks.length, pageCount }
}
