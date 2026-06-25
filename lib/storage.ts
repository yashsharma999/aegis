// Object storage seam. Originals (still-encrypted) live here; parsed text/chunks
// live in Postgres. Driver defaults to Cloudflare R2 (S3 API); set
// STORAGE_DRIVER=local for a filesystem fallback during dev without R2 creds.

import { promises as fs } from 'node:fs'
import path from 'node:path'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const driver = process.env.STORAGE_DRIVER ?? 'r2'

// ── R2 (S3-compatible) ───────────────────────────────────────────────────────
let _client: S3Client | null = null

function r2Client(): S3Client {
  const endpoint = process.env.R2_ENDPOINT
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2 is not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME in .env.local (or set STORAGE_DRIVER=local for dev).',
    )
  }
  if (!_client) {
    _client = new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId, secretAccessKey } })
  }
  return _client
}

function bucket(): string {
  const b = process.env.R2_BUCKET_NAME
  if (!b) throw new Error('R2_BUCKET_NAME is not set.')
  return b
}

// Permanent public URL for an object, when the bucket has public access enabled
// (R2_PUBLIC_URL = the pub-xxx.r2.dev domain or a custom domain). Returns null if
// no public base is configured (caller can fall back to a signed URL).
export function getPublicUrl(key: string): string | null {
  const base = process.env.R2_PUBLIC_URL
  if (!base) return null
  return `${base.replace(/\/+$/, '')}/${key}`
}

// ── local filesystem fallback ────────────────────────────────────────────────
function localPath(key: string): string {
  return path.join(process.cwd(), 'uploads', key)
}

// ── public API ───────────────────────────────────────────────────────────────
export async function putObject(
  key: string,
  bytes: Uint8Array,
  contentType = 'application/octet-stream',
): Promise<string> {
  if (driver === 'local') {
    const p = localPath(key)
    await fs.mkdir(path.dirname(p), { recursive: true })
    await fs.writeFile(p, bytes)
    return key
  }
  await r2Client().send(
    new PutObjectCommand({ Bucket: bucket(), Key: key, Body: bytes, ContentType: contentType }),
  )
  return key
}

export async function getSignedDownloadUrl(key: string, expiresIn = 300): Promise<string> {
  if (driver === 'local') return `file://${localPath(key)}`
  return getSignedUrl(r2Client(), new GetObjectCommand({ Bucket: bucket(), Key: key }), {
    expiresIn,
  })
}

export async function deleteObject(key: string): Promise<void> {
  if (driver === 'local') {
    await fs.rm(localPath(key), { force: true })
    return
  }
  await r2Client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }))
}
