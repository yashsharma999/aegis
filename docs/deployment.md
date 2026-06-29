# Deployment

Aegis deploys as **one app on Vercel** talking to **Aurora PostgreSQL** (`us-east-1`).
The Mastra agent runs **in-process** inside Next.js route handlers (`app/api/agent/*`)
— there is no separate agent server to host.

```
 Browser ──HTTPS──> Vercel (Next app)
                      ├─ /api/agent/* ── Mastra agent (in-process)
                      ├─ /api/telegram ─ Telegram webhook (after())
                      └─ auth, uploads, vault CRUD
                              │
                              └──TLS──> Aurora Postgres (us-east-1:5432)
```

Identity to the agent rides as `x-aegis-user-id` / `x-aegis-grant-token` headers
(set by the browser from the session), resolved to a `RequestContext` in
`lib/mastra/identity.ts` — the same contract the old standalone server used.

> The standalone Mastra server (`pnpm mastra:dev`, `lib/mastra/index.ts`) still
> works for local inspection / the playground, but the app no longer needs it.
> Telegram has a polling worker (`pnpm telegram`) for **local dev only**; in prod
> Telegram uses the Vercel webhook.

## Cloud resources

| Resource | Value |
|---|---|
| Aurora writer endpoint | `aegis.cluster-c0dqeqi2an5b.us-east-1.rds.amazonaws.com:5432` |
| Region | `us-east-1` |
| DB / user | `aegis` / `aegis` |
| Security group | `aegis-db-sg` (inbound 5432 from `0.0.0.0/0` — demo posture) |
| Min capacity | 0.5 ACU (stays warm; never auto-pauses mid-demo) |
| Object storage | Cloudflare R2 (`STORAGE_DRIVER=r2`) |
| GitHub repo | `yashsharma999/aegis` (Vercel deploys from `main`) |

## Environment variables (all on Vercel)

Secret values come from `.env.local` (gitignored). Non-secrets shown inline.

| Var | Value / source |
|---|---|
| `DATABASE_URL` | Aurora line from `.env.local` (incl. `?sslmode=no-verify`) |
| `DATABASE_SSL` | `require` |
| `ANTHROPIC_API_KEY` | from `.env.local` |
| `LLM_MODEL` | `anthropic/claude-sonnet-4-6` |
| `STORAGE_DRIVER` | `r2` |
| `R2_ENDPOINT` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` / `R2_PUBLIC_URL` | from `.env.local` |
| `BETTER_AUTH_SECRET` | from `.env.local` |
| `BETTER_AUTH_URL` | the Vercel prod URL, e.g. `https://aegis-xyz.vercel.app` |
| `TELEGRAM_BOT_TOKEN` | the **prod** bot token (@BotFather) |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | the prod bot @username (no `@`) |
| `TELEGRAM_WEBHOOK_SECRET` | `openssl rand -hex 32` |

`NEXT_PUBLIC_MASTRA_URL` and `WEB_ORIGIN` are **no longer used** (the agent is
same-origin now) — safe to omit.

## Deploy steps

1. **Migrate Aurora** (idempotent; `.env.local` already points at it):
   `pnpm db:migrate`.
2. **Vercel** — import the repo (auto-detects Next.js), add the vars above, deploy.
   Note the prod URL; set `BETTER_AUTH_URL` to it and redeploy.
3. **Register the Telegram webhook** (run locally, one-time, points Telegram at
   the deployed route):
   `TELEGRAM_BOT_TOKEN=<prod> TELEGRAM_WEBHOOK_SECRET=<same> pnpm telegram:webhook https://your-app.vercel.app`
4. Open the Vercel URL → sign up → test the assistant, an upload, and the prod bot.

> Agent turns run inside the Vercel function. `maxDuration` is 60s (Hobby ceiling);
> raise toward 300 on Pro/Fluid Compute if very long turns ever get cut.

## Switching the DB back to local for dev

In `.env.local`, comment the Aurora `DATABASE_URL`/`DATABASE_SSL` and uncomment the
local pair (`localhost:5433`, `DATABASE_SSL=disable`), then `pnpm db:up`. Local has
zero latency and no allowlist headaches.

---

## How this *should* be secured in production

The current setup is a **hackathon/demo posture**: Aurora is publicly reachable
(`0.0.0.0/0`), protected only by TLS + a strong password, with `sslmode=no-verify`
(encrypts but doesn't verify the server cert). Fine for a short-lived demo; not how
you'd run this for real. Hardening, roughly in priority order:

1. **Make the database private.** Aurora **Public access: No**, in **private
   subnets**. App connects over the VPC's private network.
2. **Allow by security group, not IP.** DB inbound references the app's security
   group (SG-to-SG), not a CIDR — no `0.0.0.0/0`, no IP churn.
3. **Serverless needs a private path in.** Vercel functions have rotating public
   IPs outside your VPC. Use **RDS Proxy + PrivateLink / a VPC connector**, or run
   the app in-VPC (ECS/Fargate, App Runner), or a static-egress add-on you allowlist.
4. **Verify the TLS cert.** `DATABASE_SSL=verify` with the RDS CA bundle
   (`DATABASE_SSL_CA`) instead of `no-verify` (code supports it — `lib/pg-ssl.ts`).
5. **Least-privilege DB user.** App role with DML-only on its tables, not master.
6. **Secrets in a manager, rotated** (AWS Secrets Manager / Vercel encrypted env).
7. **Connection pooling.** Front Aurora with **RDS Proxy** so serverless connection
   bursts don't exhaust the DB — especially relevant now the agent runs in Vercel
   functions.
8. **Right-size + backups.** Raise min/max ACU, deletion protection, automated
   backups/snapshots, Multi-AZ.

In short: **private DB + RDS Proxy + cert verification + least-privilege user +
managed secrets.** The `0.0.0.0/0` + password + no-verify combo is the deliberate
shortcut that gets a demo live fast.
