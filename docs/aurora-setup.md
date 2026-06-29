# Aurora PostgreSQL setup

Aegis is Postgres-agnostic — every connection reads `DATABASE_URL` and the TLS
policy in `DATABASE_SSL` (see `lib/pg-ssl.ts`). Moving from local Docker to
Aurora is therefore: provision the cluster, allowlist your IP, swap two env
vars, migrate. This runbook covers the **public + IP-allowlist** demo topology.

## 1. Create the cluster (RDS console)

1. **RDS → Create database → Standard create.**
2. Engine: **Aurora (PostgreSQL-Compatible)**, a recent **PostgreSQL 16.x** version.
3. Templates: **Dev/Test**.
4. Settings:
   - DB cluster identifier: `aegis`
   - Master username: `aegis`
   - Master password: set one (this goes in `DATABASE_URL`).
5. Instance configuration: **Serverless v2**.
   - Min capacity: **0.5 ACU** to keep the cluster warm for a live demo, or
     **0 ACU** to auto-pause when idle (cheapest, needs a 16.3+ engine — but see
     the cold-start gotcha below). Max capacity: **2 ACU** is plenty for the demo.
6. Connectivity:
   - **Public access: Yes**
   - VPC security group: **Create new**, name it `aegis-db-sg`.
7. **Additional configuration → Initial database name: `aegis`.**
   (Skip this and there's no `aegis` database to connect to.)
8. **Create database.** Provisioning takes ~5–10 min.

## 2. Allowlist your IP

1. Open the `aegis-db-sg` security group → **Inbound rules → Edit**.
2. Add: Type **PostgreSQL** (TCP 5432), Source **My IP**.
3. Save. (Re-add when your IP changes — coffee-shop wifi, VPN toggles, etc.)

## 3. Point the app at Aurora

Copy the cluster **writer endpoint** from the RDS console (Connectivity &
security tab), then in `.env.local`:

```
DATABASE_URL=postgresql://aegis:<password>@<writer-endpoint>:5432/aegis
DATABASE_SSL=require
```

`require` encrypts the connection without verifying the server cert — fine for a
demo. For stronger guarantees use `DATABASE_SSL=verify` and download the RDS CA
bundle into `DATABASE_SSL_CA`:

```
curl -o rds-global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
# .env.local
DATABASE_SSL=verify
DATABASE_SSL_CA=./rds-global-bundle.pem
```

## 4. Migrate and run

```
pnpm db:migrate     # applies drizzle/ migrations to Aurora over TLS
pnpm db:seed        # optional: load the sample vault
pnpm dev            # Next app
pnpm mastra:dev     # Mastra server (shares DATABASE_URL + DATABASE_SSL)
```

`pnpm db:migrate` runs `scripts/migrate.ts` (drizzle-orm's migrator over a pg
Pool using `pgSsl()`), **not** `drizzle-kit migrate` — the latter hangs against
Aurora with TLS on. `db:generate` and `db:studio` still use drizzle-kit.

`pnpm db:studio` opens Drizzle Studio against whatever `DATABASE_URL` points at —
so the same command browses local Docker or Aurora depending on `.env.local`.

## Notes

- **Switching back to local** is just `DATABASE_URL=postgresql://aegis:aegis@localhost:5433/aegis`
  and `DATABASE_SSL=disable` (or unset).
- **pgvector**: retrieval is hand-rolled BM25 today, so no extension is required.
  When the embeddings phase lands, Aurora PostgreSQL supports `CREATE EXTENSION vector;`.
- **Cost vs. reliability**: 0-ACU min capacity auto-pauses when idle (cheapest)
  but adds a ~15-30s cold start on the next connection — bad mid-demo. 0.5-ACU min
  stays warm for a few cents/hour. We run 0.5 during active dev / judging and can
  drop to 0 when idle for long stretches. Delete the cluster (final snapshot
  optional) when the demo's done to stop charges.
- **Mastra storage** (`@mastra/pg`) auto-creates its own thread/message tables on
  first connect — no extra migration step.

## Gotchas we hit (and the fixes)

Real problems from standing this up, kept here because each one cost time and
the fix isn't obvious from the error message.

### 1. `drizzle-kit migrate` hangs silently against Aurora
**Symptom:** `pnpm db:migrate` printed `applying migrations...` then exited 1 with
no error. **Cause:** drizzle-kit only reads TLS settings from the connection
`url`, and ignores the `ssl` option in `drizzle.config.ts` — so it tried a
plaintext connection, which Aurora drops, and the CLI swallowed the failure.
**Fix:** `db:migrate` now runs `scripts/migrate.ts`, which drives drizzle-orm's
migrator over a `pg` Pool built from `pgSsl()` — identical TLS policy to the app,
works on both local and Aurora. drizzle-kit is still fine for `generate`.

### 2. Drizzle Studio: `no pg_hba.conf entry ... no encryption`
**Symptom:** Studio launched but querying a table threw
`no pg_hba.conf entry for host "x.x.x.x", user "aegis", ... no encryption`.
**Cause:** same root cause as #1 — drizzle-kit (which powers `db:studio`) ignored
the `ssl` option and connected without TLS; Aurora rejected it at auth. Note the
error reached *authentication*, which proves the IP was allowlisted — the only
problem was the missing encryption. **Fix:** put the TLS mode in the URL itself:
append `?sslmode=no-verify` to the Aurora `DATABASE_URL`. The app and
`scripts/migrate.ts` pass `ssl` explicitly so they're unaffected; this query
param exists purely so drizzle-kit negotiates TLS.

### 3. `ECONNREFUSED` / `ETIMEDOUT` after it had been working
**Symptom:** connections that worked minutes earlier started failing with
`ECONNREFUSED 100.x.x.x:5432`. **Cause:** min capacity was **0 ACU**, so the
cluster **auto-paused when idle**; the first connections during wake are
refused/timed-out for ~15-30s. We first suspected VPN DNS hijack, but checking
`nslookup` against `8.8.8.8` and `1.1.1.1` showed all resolvers agreed on the
real Aurora IP — ruling DNS out and pointing at the paused instance. **Fix:** set
min capacity to **0.5 ACU** so it never pauses. Diagnostic worth remembering:
`ETIMEDOUT` = firewall/security-group dropping packets; `ECONNREFUSED` = host
reachable but nothing listening (instance paused/down) — two different problems.

### 4. The IP allowlist is per-source-IP, and VPNs rotate it
**Symptom:** intermittent timeouts even though nothing changed. **Cause:** the
`aegis-db-sg` inbound rule allows a single `/32`; on a VPN your public IP changes
when you switch servers/networks, silently breaking access. **Fix for dev:**
re-run **My IP** in the security group when it breaks. **Key insight for the
demo:** end users never connect to Postgres — only the *app server* does. So at
deploy time you allowlist the **app server's** egress IP, not users'. For a
serverless host with rotating IPs (e.g. Vercel), open `0.0.0.0/0` and rely on
**TLS + a strong password**, or use a static-egress add-on.

### Demo-day checklist
- Min capacity **≥ 0.5 ACU** (no cold-start pause mid-demo).
- App server egress IP allowlisted in `aegis-db-sg` (or `0.0.0.0/0` + TLS + strong
  password for serverless hosting).
- `DATABASE_SSL=require` and the Aurora `DATABASE_URL` carries `?sslmode=no-verify`.
- Smoke-test the deployed app's DB path before judging — don't trust localhost.
