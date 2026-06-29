// Minimal Telegram Bot API client over fetch — just the transport the worker
// needs (long-poll getUpdates + send). No dependency; we deliberately skip
// @chat-adapter/telegram since we're not using Mastra's channels pipeline (the
// vault is multi-tenant and needs per-sender identity, resolved in resolve.ts).

import { formatForTelegram, stripHtml } from './format'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? ''
const API = `https://api.telegram.org/bot${TOKEN}`

// The slice of a Telegram update we act on: a text message and/or a shared
// contact (when the user taps the "Share my number" button).
export interface TgMessage {
  updateId: number
  chatId: number
  fromId: number
  text: string
  fromName: string
  contactPhone?: string // set when the user shares their own contact
}

export interface RawUpdate {
  update_id: number
  message?: {
    chat: { id: number }
    from?: { id: number; first_name?: string; username?: string }
    text?: string
    contact?: { phone_number: string; user_id?: number }
  }
}

// Normalize one raw Telegram update into our TgMessage, or null if it isn't a
// message we act on. Shared by the polling worker (getUpdates) and the webhook
// route so both paths behave identically.
export function parseUpdate(u: RawUpdate): TgMessage | null {
  const m = u.message
  if (!m) return null
  // Only act on a contact share if it's the user's OWN number.
  const ownContact =
    m.contact && (m.contact.user_id === undefined || m.contact.user_id === m.from?.id)
      ? m.contact.phone_number
      : undefined
  if (!m.text && !ownContact) return null
  return {
    updateId: u.update_id,
    chatId: m.chat.id,
    fromId: m.from?.id ?? m.chat.id,
    text: m.text ?? '',
    fromName: m.from?.first_name || m.from?.username || 'there',
    contactPhone: ownContact,
  }
}

async function call<T>(method: string, body: unknown, timeoutMs = 15_000): Promise<T> {
  // Abort a hung/reset socket instead of blocking the worker forever.
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })
  const json = (await res.json()) as { ok: boolean; result?: T; description?: string }
  if (!json.ok) throw new Error(`Telegram ${method} failed: ${json.description ?? res.status}`)
  return json.result as T
}

export function hasToken(): boolean {
  return TOKEN.length > 0
}

// Startup connectivity check — returns the bot's username, or throws with the
// network/auth reason so the worker can report it clearly.
export async function getMe(): Promise<{ username?: string }> {
  return call<{ username?: string }>('getMe', {})
}

// Poll for new messages. `offset` is the next update_id to fetch. A short hold
// (3s) keeps the connection from sitting idle long enough for a flaky VPN/NAT to
// reset it, while staying near-instant when a message arrives mid-poll.
export async function getUpdates(offset: number, timeout = 3): Promise<TgMessage[]> {
  const updates = await call<RawUpdate[]>(
    'getUpdates',
    { offset, timeout, allowed_updates: ['message'] },
    (timeout + 8) * 1000, // abort budget must outlast the long-poll hold
  )
  return updates.map(parseUpdate).filter((m): m is TgMessage => m !== null)
}

// ── Webhook registration (production) ─────────────────────────────────────────
// Telegram pushes each update to `url` as an HTTP POST and echoes `secretToken`
// in the X-Telegram-Bot-Api-Secret-Token header so the route can verify it.
export async function setWebhook(url: string, secretToken?: string): Promise<void> {
  await call('setWebhook', {
    url,
    secret_token: secretToken || undefined,
    allowed_updates: ['message'],
    drop_pending_updates: true,
  })
}

// Clears the webhook so the bot can fall back to polling (e.g. local dev).
export async function deleteWebhook(): Promise<void> {
  await call('deleteWebhook', { drop_pending_updates: false })
}

export async function sendMessage(chatId: number | string, text: string): Promise<void> {
  // The agent replies in markdown; render it as Telegram HTML, split into
  // <=4096-char chunks, and clear any custom keyboard (e.g. the share-number
  // button) once we reply.
  for (const chunk of formatForTelegram(text)) {
    try {
      await call('sendMessage', {
        chat_id: chatId,
        text: chunk,
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
        reply_markup: { remove_keyboard: true },
      })
    } catch {
      // Telegram rejected the HTML entities — resend as plain text so the user
      // still gets the answer.
      await call('sendMessage', {
        chat_id: chatId,
        text: stripHtml(chunk),
        reply_markup: { remove_keyboard: true },
      })
    }
  }
}

// Prompt the user to share their own phone number with a one-tap button.
export async function requestPhone(chatId: number | string, text: string): Promise<void> {
  await call('sendMessage', {
    chat_id: chatId,
    text,
    reply_markup: {
      keyboard: [[{ text: '📱 Share my number', request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  })
}

export async function sendTyping(chatId: number | string): Promise<void> {
  // Best-effort; never block a reply on the typing indicator.
  await call('sendChatAction', { chat_id: chatId, action: 'typing' }).catch(() => {})
}
