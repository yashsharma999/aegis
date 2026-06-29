// Long-poll worker that bridges Telegram ↔ the Aegis vault agent.
//
//   pnpm telegram
//
// For local dev: no public URL/tunnel needed — it pulls updates via getUpdates
// and dispatches each through the SAME handleMessage the production webhook
// route uses (lib/telegram/handle.ts). In production prefer the webhook route
// (app/api/telegram/route.ts) so there's no always-on process; the bot can't
// both poll and have a webhook set, so clear it first: pnpm telegram:webhook --clear

import { config } from 'dotenv'

config({ path: '.env.local' })

async function main() {
  const { getUpdates, getMe, hasToken } = await import('../lib/telegram/client')
  const { handleMessage } = await import('../lib/telegram/handle')

  if (!hasToken()) {
    console.error('TELEGRAM_BOT_TOKEN is not set in .env.local — get one from @BotFather.')
    process.exit(1)
  }

  // Fail fast with a clear reason if we can't reach Telegram at all.
  try {
    const me = await getMe()
    console.log(`Connected to @${me.username ?? 'bot'}.`)
  } catch (err) {
    console.error(
      'Cannot reach Telegram (getMe failed):',
      err instanceof Error ? err.message : err,
      '\n→ Check the token, your network/VPN (Telegram is throttled by some ISPs), or clear a webhook with `pnpm telegram:webhook --clear`.',
    )
    process.exit(1)
  }

  console.log('Aegis Telegram worker started. Polling for messages…')
  let offset = 0

  // Graceful shutdown so the process exits cleanly on Ctrl-C.
  let running = true
  process.on('SIGINT', () => {
    running = false
  })

  // Network blips (a VPN/NAT resetting the idle poll) are transient and recover
  // on the next poll. Log the first failure and recoveries, not every retry, so
  // the console isn't a wall of identical lines.
  let fails = 0
  while (running) {
    let updates
    try {
      updates = await getUpdates(offset)
      if (fails > 0) {
        console.log(`Polling recovered (after ${fails} failed attempt${fails > 1 ? 's' : ''}).`)
        fails = 0
      }
    } catch (err) {
      fails++
      if (fails === 1 || fails % 20 === 0) {
        console.error(`getUpdates failing (${fails}×, will keep retrying): ${err instanceof Error ? err.message : err}`)
      }
      await new Promise((r) => setTimeout(r, 1500))
      continue
    }

    for (const msg of updates) {
      offset = msg.updateId + 1
      await handleMessage(msg)
    }
  }

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
