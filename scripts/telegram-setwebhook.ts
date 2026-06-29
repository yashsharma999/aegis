// CLI: register (or clear) the Telegram webhook for production.
//
//   pnpm telegram:webhook https://your-app.vercel.app   # register
//   pnpm telegram:webhook                               # uses BETTER_AUTH_URL
//   pnpm telegram:webhook --clear                       # back to polling (local dev)
//
// Run this once after each prod deploy (it needs the final public URL). A bot
// can't both poll and have a webhook, so --clear before running `pnpm telegram`
// locally. The secret token (TELEGRAM_WEBHOOK_SECRET) is echoed by Telegram in
// every request and verified by app/api/telegram/route.ts.

import { config } from 'dotenv'

config({ path: '.env.local' })

async function main() {
  const { setWebhook, deleteWebhook, hasToken } = await import('../lib/telegram/client')

  if (!hasToken()) {
    console.error('TELEGRAM_BOT_TOKEN is not set in .env.local — get one from @BotFather.')
    process.exit(1)
  }

  const args = process.argv.slice(2)
  if (args.includes('--clear')) {
    await deleteWebhook()
    console.log('Webhook cleared. The bot can now be polled with `pnpm telegram`.')
    return
  }

  const base = (args.find((a) => !a.startsWith('--')) ?? process.env.BETTER_AUTH_URL ?? '').replace(/\/$/, '')
  if (!base || !base.startsWith('https://')) {
    console.error(
      'Provide an https URL: pnpm telegram:webhook https://your-app.vercel.app (or set BETTER_AUTH_URL).',
    )
    process.exit(1)
  }

  const url = `${base}/api/telegram`
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!secret) {
    console.warn('⚠ TELEGRAM_WEBHOOK_SECRET is not set — the webhook will accept unauthenticated POSTs.')
  }
  await setWebhook(url, secret)
  console.log(`Webhook registered → ${url}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
