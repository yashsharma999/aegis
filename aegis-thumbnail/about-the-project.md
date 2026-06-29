## Inspiration
When someone passes away or is incapacitated, their family is usually locked out of the things that matter most: insurance policies, account details, key documents, and the simple knowledge of "where is everything and what do I do now." That information lives in one person's head, inbox, or a drawer nobody can find. We wanted a calm, trustworthy place that holds all of it and, more importantly, can answer questions about it in plain language for the people left to deal with it.

Aegis is that place. It is a private vault with an AI agent that knows your documents and can guide your loved ones through them, on the web or right inside a chat app.

## What it does
- Keeps your important context in one vault: uploaded files (PDFs, policies, statements), rich markdown notes, structured contacts, and shielded credentials.
- Answers anything in natural language. The Aegis agent searches the vault, reads the relevant document, cites its source, and gives a precise answer instead of a wall of text.
- Surfaces what is time sensitive: upcoming renewals, premiums, and expiries derived directly from your documents.
- Gives beneficiaries scoped access. The owner shares a grant link, and the same agent answers the beneficiary's questions without ever exposing the owner's raw logins.
- Works where people already are. Beyond the web app, you can talk to your vault over Telegram and WhatsApp through the exact same agent.

## How we built it
Aegis is a single Next.js app deployed entirely on Vercel, with Amazon Aurora (PostgreSQL, Serverless v2) as the system of record.

- Data model: a deliberate, document-centric schema in Aurora via Drizzle ORM. Everything the agent can reason about (files, notes, contacts, reminders) is modeled as retrievable context, with auth handled by Better Auth.
- Agent: one Mastra agent, defined once and reused for every audience. We run it in-process inside a Vercel serverless function using the AI SDK and stream the agent's native chunks to the browser as NDJSON, so there is no separate always-on server to operate.
- Retrieval: a hand-rolled BM25 full-text search over chunked documents, written in plain SQL so it runs anywhere Postgres runs, including Aurora, with no extensions and no external vector service. The agent's tools (searchVault, readDocument, getDocumentLink, getReminders, getContacts) sit on top of it.
- Storage and ingestion: original files live in S3 and are shared as short-lived presigned links, and PDF text is extracted with unpdf for indexing.
- Channels: Telegram and WhatsApp are wired in as Vercel webhooks that bridge an incoming message to the same vault agent, with owner pairing codes and beneficiary grant tokens controlling who is talking to which vault.

## Challenges we ran into
- Running an agent on serverless. Moving from a standalone Mastra server to an in-process agent on Vercel meant respecting the 60 second function ceiling while still streaming long, multi-step answers. We forward the agent's full stream straight to the client so responses feel live.
- Retrieval without crutches. We deliberately avoided pgvector and third-party search so the whole system stays portable to Aurora. Tuning a from-scratch BM25 to return the right snippet, and teaching the agent when to search versus read a whole document, took real iteration.
- One path, many audiences. Owners and beneficiaries need very different trust levels but the same quality of help. We solved this with a grant token in middleware rather than a second codebase, so there is exactly one agent and one retrieval path to maintain.

## Accomplishments that we're proud of
- A genuinely full-stack, shippable product on a clean stack: Aurora plus Vercel, with no glue servers in between.
- One agent, one retrieval pipeline, three surfaces (web, Telegram, WhatsApp).
- Source-cited answers, so the vault is trustworthy and not just conversational.

## What we learned
- A deliberate data model beats a clever index. Modeling everything as retrievable context made the agent simpler and the answers better.
- You can run a real, streaming agent fully on Vercel with no dedicated backend, as long as you design around the serverless constraints from the start.
- Portability is a feature. Keeping retrieval in plain SQL meant Aurora was a drop-in choice, not a painful migration.

## What's next for Aegis
- Legacy Mode: time-based and verification-based release of sensitive items to beneficiaries.
- Deeper reminders and proactive nudges from the agent.
- More channels and richer document understanding (tables, scanned pages, multiple languages).
