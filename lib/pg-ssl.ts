// Shared TLS config for every Postgres connection (the pg Pool in lib/drizzle.ts,
// the Mastra PostgresStore in lib/mastra/storage.ts, and drizzle-kit migrations).
//
// Aurora — like most managed Postgres — refuses non-TLS connections, while the
// local Docker Postgres (docker-compose.yml) speaks plaintext. `DATABASE_SSL`
// switches between them so the same code runs in both:
//
//   unset / 'disable'    -> no TLS               (local dev, the default)
//   'require'/'no-verify'-> TLS, skip CA check    (quickest Aurora path)
//   'verify'             -> TLS, verify the server cert against DATABASE_SSL_CA
//                           (point it at the AWS RDS global root CA bundle PEM)
//
// `require` encrypts the connection but does not authenticate the server, so it
// can't detect a MITM. It's fine for a public+IP-allowlisted demo; use `verify`
// with the RDS CA bundle for anything you'd call production.

import { readFileSync } from 'node:fs'
import type { ConnectionOptions } from 'node:tls'

export function pgSsl(): boolean | ConnectionOptions {
  const mode = (process.env.DATABASE_SSL ?? 'disable').toLowerCase()

  if (mode === 'disable') return false
  if (mode === 'require' || mode === 'no-verify') return { rejectUnauthorized: false }
  if (mode === 'verify') {
    const caPath = process.env.DATABASE_SSL_CA
    if (!caPath) {
      throw new Error(
        'DATABASE_SSL=verify requires DATABASE_SSL_CA to point at the RDS CA bundle PEM ' +
          '(download: https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem).',
      )
    }
    return { rejectUnauthorized: true, ca: readFileSync(caPath, 'utf8') }
  }

  throw new Error(`Unknown DATABASE_SSL=${mode} (expected: disable | require | verify).`)
}
