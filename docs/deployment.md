# Deployment

Aegis is **two processes** that must both be hosted (ideally near the DB in
`us-east-1`):

- **Next.js app** — UI, auth (Better Auth), uploads, vault CRUD. → **Vercel**
- **Mastra server** — the standalone agent server the browser calls via
  `NEXT_PUBLIC_MASTRA_URL` (`@mastra/client-js`). → **Railway** (US East)

Both talk to the same **Aurora PostgreSQL** (`us-east-1`) — see
[`aurora-setup.md`](./aurora-setup.md).

```
 Browser ──HTTPS──> Vercel (Next app) ──┐
    │                                    ├──> Aurora Postgres (us-east-1:5432, TLS)
    └──HTTPS (client-js)──> Railway (Mastra server) ──┘
```

Identity to the Mastra server is per-request via the `x-aegis-user-id` header
(set by the Next client from the session) — **not** cookies — so the two can
live on different domains. CORS on the Mastra server is locked to `WEB_ORIGIN`.

## Cloud resources

| Resource | Value |
|---|---|
| Aurora writer endpoint | `aegis.cluster-c0dqeqi2an5b.us-east-1.rds.amazonaws.com:5432` |
| Region | `us-east-1` |
| DB / user | `aegis` / `aegis` |
| Security group | `aegis-db-sg` (currently inbound 5432 from `0.0.0.0/0` — demo posture) |
| Min capacity | 0.5 ACU (stays warm; never auto-pauses mid-demo) |
| Object storage | Cloudflare R2 (`STORAGE_DRIVER=r2`) |
| GitHub repo | `yashsharma999/aegis` (deploys from `main`) |

## Build & run commands

| | Build | Start |
|---|---|---|
| Next (Vercel) | `next build` (auto) | `next start` (auto) |
| Mastra (Railway) | `pnpm install && pnpm mastra:build` | `pnpm mastra:start` |

`mastra:build` → `mastra build --dir lib/mastra` (outputs `.mastra/output`).
`mastra:start` → `mastra start`. The server reads `$PORT` (Railway injects it),
falling back to `MASTRA_PORT` locally.

## Environment variables

Secret values live in `.env.local` (gitignored) — copy from there. Non-secret
values are shown inline.

| Var | Vercel | Railway | Value / source |
|---|:--:|:--:|---|
| `DATABASE_URL` | ✅ | ✅ | Aurora line from `.env.local` (incl. `?sslmode=no-verify`) |
| `DATABASE_SSL` | ✅ | ✅ | `require` |
| `ANTHROPIC_API_KEY` | ✅ | ✅ | from `.env.local` |
| `LLM_MODEL` | ✅ | ✅ | `anthropic/claude-sonnet-4-6` |
| `STORAGE_DRIVER` | ✅ | ✅ | `r2` |
| `R2_ENDPOINT` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` / `R2_PUBLIC_URL` | ✅ | ✅ | from `.env.local` |
| `BETTER_AUTH_SECRET` | ✅ | — | from `.env.local` |
| `BETTER_AUTH_URL` | ✅ | — | the Vercel prod URL, e.g. `https://aegis-xyz.vercel.app` |
| `NEXT_PUBLIC_MASTRA_URL` | ✅ | — | the Railway public URL |
| `WEB_ORIGIN` | — | ✅ | the Vercel prod URL (CORS allow-list) |
| `PORT` | — | auto | Railway injects it — **do not set** |

Both services need DB + R2 + Anthropic (the Mastra server queries the vault and
its `getDocumentLink` tool signs R2 URLs; the Next app does uploads + CRUD).

## Deploy order (avoids URL chicken-and-egg)

1. **Railway first** — deploy the Mastra service (build/start + vars above, leave
   `WEB_ORIGIN` blank). Generate a public domain → this is `NEXT_PUBLIC_MASTRA_URL`.
2. **Vercel** — import the repo, add vars (set `NEXT_PUBLIC_MASTRA_URL` to the
   Railway URL). Deploy; note the prod URL. Fix `BETTER_AUTH_URL` to the real
   prod URL if you guessed it, then redeploy.
3. **Back to Railway** — set `WEB_ORIGIN` = the Vercel URL; it redeploys. CORS now
   lets the browser call the Mastra server.
4. Open the Vercel URL → sign up / log in → test assistant + an upload.

## Switching the DB back to local for dev

In `.env.local`, comment the Aurora `DATABASE_URL`/`DATABASE_SSL` and uncomment
the local pair (`localhost:5433`, `DATABASE_SSL=disable`), then `pnpm db:up`.
Local has zero latency and no allowlist headaches; use Aurora only to exercise
the cloud path.

---

## How this *should* be secured in production

The current setup is a **hackathon/demo posture**: Aurora is publicly reachable
(`0.0.0.0/0`) and protected only by TLS + a strong password, with `sslmode` set
to `no-verify` (encrypts but doesn't verify the server cert). That's fine for a
short-lived demo; it is **not** how you'd run this for real. Production hardening,
roughly in priority order:

1. **Make the database private.** Set Aurora **Public access: No** and place it in
   **private subnets**. Nothing from the internet can reach port 5432. App servers
   connect over the VPC's private network.

2. **Allow by security group, not by IP.** The DB's inbound rule should reference
   the **app server's security group** as the source (SG-to-SG), not a CIDR. Then
   only resources in that SG can connect, regardless of their IP — no `0.0.0.0/0`,
   no IP-allowlist churn.

3. **Serverless apps need a private path in.** Vercel functions have rotating
   public IPs and live outside your VPC, so they can't use SG-to-SG directly.
   Options: deploy the app **inside the same VPC** (e.g. ECS/Fargate, App Runner,
   EC2), or use **RDS Proxy + PrivateLink / a VPC connector**, or a static-egress
   add-on whose fixed IPs you allowlist. The clean version is: run the API/app in
   the VPC and keep the DB private.

4. **Verify the TLS cert.** Use `DATABASE_SSL=verify` with the RDS CA bundle
   (`DATABASE_SSL_CA`) instead of `no-verify`, so a man-in-the-middle can't
   impersonate the DB. (Code already supports this — see `lib/pg-ssl.ts`.)

5. **Least-privilege DB user.** The app should use a role with only the privileges
   it needs (DML on its tables), **not** the master/superuser. Keep the master
   creds for migrations/admin only.

6. **Secrets in a manager, rotated.** Store DB creds, R2 keys, and
   `BETTER_AUTH_SECRET` in a secrets manager (AWS Secrets Manager / Vercel
   encrypted env), with rotation — never in a file or image. RDS can manage +
   rotate the master password for you.

7. **Connection pooling.** Front Aurora with **RDS Proxy** (or PgBouncer) so
   bursts of serverless connections don't exhaust the DB's connection limit.

8. **Right-size + backups.** Raise min/max ACU for real traffic, enable deletion
   protection, automated backups/snapshots, and Multi-AZ for failover.

In short: **private DB + SG-to-SG (or RDS Proxy) + cert verification + a
least-privilege user + managed secrets.** The `0.0.0.0/0` + password + no-verify
combo we use now is the deliberate shortcut that gets a demo live fast.
