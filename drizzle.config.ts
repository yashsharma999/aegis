import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'
import { pgSsl } from './lib/pg-ssl'

config({ path: '.env.local' })

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    // Migrations must use the same TLS policy as the app (Aurora rejects plaintext).
    ssl: pgSsl(),
  },
})
