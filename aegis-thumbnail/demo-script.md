# Aegis - Demo Video Script (revised)

Target length: about 2 minutes. Record the screen silently, then I lay the AI voiceover over your footage.

Required beats this script covers:
- The problem, for whom, and why we chose it (scene 1)
- The app actually working (scenes 2 to 6)
- The AWS Database choice (Aurora) and why, explained deliberately (scene 7)

| # | Show on screen | Narration |
|---|----------------|-----------|
| 1 | Cover / landing page | "Everyone has a handful of things their family would be lost without. Insurance policies, account details, key documents. Today that lives in one person's head or a drawer, and when something happens, the people left behind cannot find it or understand it. We built Aegis for them: families and next of kin, and anyone who wants their affairs to be findable when it matters. We chose this problem because it is universal, deeply human, and still unsolved. A password manager can store secrets, but it cannot answer questions." |
| 2 | The vault: files, notes, contacts | "Aegis is a private vault with an AI agent. You keep your documents, notes, contacts, and credentials in one secure place." |
| 3 | Type a question, agent answers with a cited source | "Then you just ask. The agent searches your vault with full-text search, reads the right document, and answers in plain language with the source cited. No scrolling through PDFs." |
| 4 | Reminders / renewals | "It also surfaces what is time sensitive, like renewals and premiums, pulled straight from your documents." |
| 5 | Open a beneficiary grant link, ask a question | "When it matters most, you share a secure link with a loved one. The same agent guides them through everything, without ever exposing your raw logins." |
| 6 | Telegram chat with the vault | "And you can talk to your vault right inside Telegram. The same agent, wherever you are." |
| 7 | Architecture diagram | "For the database we chose Amazon Aurora, PostgreSQL Serverless v2, and the choice was deliberate. A vault is deeply relational. Documents, their text chunks, contacts, reminders, and the agent's own memory all live in one carefully modeled schema. We wanted real full-text search, so we wrote BM25 ranking in plain SQL, with no extensions and no separate vector database, which means it runs on standard Postgres unchanged. Aurora gives us managed durability and automatic serverless scaling that handles a quiet vault and a sudden burst equally well, while staying standard Postgres, so there is no proprietary lock-in. The whole app runs on Vercel with the agent in-process. One agent, one retrieval path, ready to ship." |

## Recording notes
- Cmd + Shift + 5 to record the screen. Clean browser window, no bookmarks bar.
- Move slowly, pause about 1 second on each screen. I will sync the voiceover to your footage afterward.
- Export and upload to YouTube, set to Public (or Unlisted is usually accepted, but the form says Public is preferred).
