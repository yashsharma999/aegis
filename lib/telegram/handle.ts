// Single dispatch path for an inbound Telegram message, shared by the polling
// worker (scripts/telegram.ts) and the webhook route (app/api/telegram/route.ts).
// Resolves the sender to a vault identity, then runs the same vaultAgent turn
// the web app uses (lib/agent.ts runVaultTurn). Owns its own error handling so
// both callers behave identically.

import { sendMessage, sendTyping, requestPhone, type TgMessage } from './client'
import { resolveSender, bindSender, bindByPhone } from './resolve'
import { runVaultTurn } from '../agent'

export async function handleMessage(msg: TgMessage): Promise<void> {
  try {
    await dispatch(msg)
  } catch (err) {
    console.error('telegram handler error:', err instanceof Error ? err.message : err)
    await sendMessage(msg.chatId, 'Something went wrong on my side. Please try again.').catch(() => {})
  }
}

async function dispatch(msg: TgMessage): Promise<void> {
  // The frictionless path: the user tapped "Share my number".
  if (msg.contactPhone) {
    const result = await bindByPhone(msg.fromId, msg.chatId, msg.contactPhone, msg.fromName)
    await sendMessage(msg.chatId, result.ok ? result.greeting : result.message)
    return
  }

  const text = msg.text.trim()

  // Binding by code: `/start <pairing-code|grant-token>` (owners, or fallback).
  if (text.startsWith('/start')) {
    const arg = text.slice('/start'.length).trim()
    if (!arg) {
      await requestPhone(
        msg.chatId,
        'Welcome to Aegis. If you\'re a beneficiary, tap below to share your number and I\'ll connect you. Owners: send /start followed by your pairing code from the app.',
      )
      return
    }
    const result = await bindSender(msg.fromId, msg.chatId, msg.fromName, arg)
    await sendMessage(msg.chatId, result.ok ? result.greeting : result.message)
    return
  }

  const resolved = await resolveSender(msg.fromId)
  if (resolved.kind === 'unlinked') {
    // Offer the one-tap number share (beneficiaries); owners use /start <code>.
    await requestPhone(
      msg.chatId,
      'You\'re not connected to a vault yet. Tap below to share your number and I\'ll recognize you — or, if you\'re the owner, send /start followed by your pairing code.',
    )
    return
  }
  if (resolved.kind === 'locked') {
    await sendMessage(msg.chatId, resolved.reason)
    return
  }

  await sendTyping(msg.chatId)
  const reply = await runVaultTurn({ ...resolved.turn, message: text })
  await sendMessage(msg.chatId, reply.text)
}
