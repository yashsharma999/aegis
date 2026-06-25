'use client'

// Module-level chat session store (eugenia pattern). Conversation state lives
// OUTSIDE React, keyed by threadId, so it survives the remount that happens when
// the first message flips the URL to /assistant/<id>.
//
// The active thread id is derived from usePathname() — NOT React state — because
// window.history.replaceState updates the URL (and usePathname) but Next does NOT
// route to the [threadId] segment; it re-renders the /assistant page in place. A
// useState-minted id would be regenerated on that re-render and orphan the live
// stream. The new-chat id is held in a module variable so it's stable across the
// flip until the user explicitly starts another new chat (resetNewChat).

import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { mastraClientFor, VAULT_AGENT_ID } from '@/lib/mastra-client'

export type ChatPart =
  | { type: 'text'; text: string }
  | { type: 'tool'; id: string; name: string; args?: unknown; result?: unknown; done: boolean }

export type Bubble = { id: string; from: 'user' | 'agent'; parts: ChatPart[] }

// How a caller authenticates to the agent. Owner presents a userId; a
// beneficiary presents a grant token (+ legacy mode). Passed straight to
// mastraClientFor → request headers.
type Auth = { userId?: string; grantToken?: string; mode?: string }

type Session = {
  threadId: string
  userId: string // memory partition / hydrate scope (owner = userId, beneficiary = grant:<token>)
  auth: Auth
  resource: string
  ephemeral: boolean // beneficiary chat: no URL flip, no history hydrate
  messages: Bubble[]
  busy: boolean
  hydrated: boolean
  needsUrlFlip: boolean
  listeners: Set<() => void>
  version: number
}

const sessions = new Map<string, Session>()

// Stable id for the in-progress "new chat" — survives the replaceState remount.
let pendingNewId: string | null = null
function newChatId(): string {
  if (!pendingNewId) pendingNewId = crypto.randomUUID()
  return pendingNewId
}
export function resetNewChat(): void {
  pendingNewId = null
}

export function threadIdFromPath(pathname: string | null): string | null {
  const m = /\/assistant\/([^/?#]+)/.exec(pathname ?? '')
  return m ? m[1] : null
}

function getSession(
  threadId: string,
  init: { userId: string; auth: Auth; resource: string; ephemeral: boolean; isNew: boolean },
): Session {
  let s = sessions.get(threadId)
  if (!s) {
    s = {
      threadId,
      userId: init.userId,
      auth: init.auth,
      resource: init.resource,
      ephemeral: init.ephemeral,
      messages: [],
      busy: false,
      // Ephemeral (beneficiary) chats never hydrate; a fresh owner chat has no
      // history to fetch.
      hydrated: init.ephemeral || init.isNew,
      // Only the owner chat flips the URL to /assistant/<id>.
      needsUrlFlip: !init.ephemeral && init.isNew,
      listeners: new Set(),
      version: 0,
    }
    sessions.set(threadId, s)
  }
  s.userId = init.userId
  s.auth = init.auth
  s.resource = init.resource
  return s
}

function emit(s: Session) {
  s.version++
  for (const l of s.listeners) l()
}

function patch(s: Session, agentId: string, fn: (parts: ChatPart[]) => ChatPart[]) {
  s.messages = s.messages.map((m) => (m.id === agentId ? { ...m, parts: fn(m.parts) } : m))
  emit(s)
}

function mapDbMessage(m: Record<string, any>): Bubble | null {
  const from: 'user' | 'agent' = m?.role === 'user' ? 'user' : 'agent'
  const raw: any[] = Array.isArray(m?.content?.parts)
    ? m.content.parts
    : typeof m?.content === 'string'
      ? [{ type: 'text', text: m.content }]
      : []
  const parts: ChatPart[] = []
  for (const p of raw) {
    if (p?.type === 'text' && p.text) {
      parts.push({ type: 'text', text: String(p.text) })
    } else if (p?.type === 'tool-invocation' && p.toolInvocation) {
      const ti = p.toolInvocation
      parts.push({
        type: 'tool',
        id: String(ti.toolCallId ?? parts.length),
        name: String(ti.toolName ?? 'tool'),
        args: ti.args,
        result: ti.result,
        done: (ti.state ?? 'result') === 'result' || ti.result !== undefined,
      })
    } else if (typeof p?.type === 'string' && p.type.startsWith('tool')) {
      parts.push({
        type: 'tool',
        id: String(p.toolCallId ?? parts.length),
        name: String(p.toolName ?? p.type),
        args: p.args ?? p.input,
        result: p.result ?? p.output,
        done: true,
      })
    }
  }
  if (parts.length === 0) return null
  return { id: String(m?.id ?? crypto.randomUUID()), from, parts }
}

async function hydrate(s: Session) {
  if (s.hydrated) return
  s.hydrated = true
  try {
    const res = await mastraClientFor(s.auth).listThreadMessages(s.threadId, {
      agentId: VAULT_AGENT_ID,
    })
    const prior = (((res as any)?.messages ?? []).map(mapDbMessage).filter(Boolean)) as Bubble[]
    if (prior.length) {
      s.messages = [...prior, ...s.messages]
      emit(s)
    }
  } catch {
    // New/unknown thread — start empty.
  }
}

async function send(s: Session, text: string, onActivity?: () => void) {
  const trimmed = text.trim()
  if (!trimmed || s.busy) return

  // First message of a new chat: flip the URL so the thread is deep-linkable.
  // The session is keyed by this id and pendingNewId stays set, so the
  // in-place remount resolves back to THIS session (no orphan).
  if (s.needsUrlFlip) {
    s.needsUrlFlip = false
    window.history.replaceState(null, '', `/assistant/${s.threadId}`)
  }

  const agentId = crypto.randomUUID()
  s.messages = [
    ...s.messages,
    { id: crypto.randomUUID(), from: 'user', parts: [{ type: 'text', text: trimmed }] },
    { id: agentId, from: 'agent', parts: [] },
  ]
  s.busy = true
  emit(s)

  const onChunk = (chunk: { type: string; payload?: any }) => {
    const p = chunk.payload ?? {}
    if (chunk.type === 'text-delta' && p.text) {
      patch(s, agentId, (parts) => {
        const last = parts[parts.length - 1]
        if (last?.type === 'text') return [...parts.slice(0, -1), { ...last, text: last.text + p.text }]
        return [...parts, { type: 'text', text: p.text }]
      })
    } else if (chunk.type === 'tool-call') {
      patch(s, agentId, (parts) => [
        ...parts,
        { type: 'tool', id: String(p.toolCallId ?? ''), name: String(p.toolName ?? 'tool'), args: p.args, done: false },
      ])
    } else if (chunk.type === 'tool-result') {
      patch(s, agentId, (parts) =>
        parts.map((part) =>
          part.type === 'tool' && part.id === String(p.toolCallId ?? '')
            ? { ...part, result: p.result, done: true }
            : part,
        ),
      )
    }
  }

  try {
    const agent = mastraClientFor(s.auth).getAgent(VAULT_AGENT_ID)
    const res = await agent.stream([{ role: 'user', content: trimmed }], {
      memory: { thread: s.threadId, resource: s.resource },
    })
    await res.processDataStream({ onChunk })
  } catch {
    patch(s, agentId, (parts) => [...parts, { type: 'text', text: 'Sorry, something went wrong.' }])
  } finally {
    s.busy = false
    emit(s)
    onActivity?.()
  }
}

function useSession(s: Session, onActivity?: () => void) {
  const subscribe = useCallback(
    (cb: () => void) => {
      s.listeners.add(cb)
      return () => {
        s.listeners.delete(cb)
      }
    },
    [s],
  )
  useSyncExternalStore(
    subscribe,
    () => s.version,
    () => s.version,
  )

  useEffect(() => {
    void hydrate(s)
  }, [s])

  return {
    threadId: s.threadId,
    messages: s.messages,
    busy: s.busy,
    send: (text: string) => send(s, text, onActivity),
  }
}

// Owner chat: identity = userId, memory partitioned by userId, URL-coupled
// (deep-linkable threads under /assistant/<id>).
export function useChatSession(userId: string, onActivity?: () => void) {
  const pathname = usePathname()
  const fromUrl = threadIdFromPath(pathname)
  const threadId = fromUrl ?? newChatId()
  const s = getSession(threadId, {
    userId,
    auth: { userId },
    resource: userId,
    ephemeral: false,
    isNew: !fromUrl,
  })
  return useSession(s, onActivity)
}

// Beneficiary chat: identity = a grant token (no owner id). Legacy mode, a
// single stable thread per token, memory partitioned away from the owner, no
// URL flip and no history hydrate.
export function useLegacyChatSession(grantToken: string, onActivity?: () => void) {
  const resource = `grant:${grantToken}`
  const s = getSession(`legacy:${grantToken}`, {
    userId: resource,
    auth: { grantToken, mode: 'legacy' },
    resource,
    ephemeral: true,
    isNew: true,
  })
  return useSession(s, onActivity)
}

// Owner previewing Legacy Mode over their OWN vault: identity = userId + legacy
// mode, partitioned away from their everyday threads.
export function useOwnerLegacyPreviewSession(userId: string, onActivity?: () => void) {
  const resource = `${userId}:legacy-preview`
  const s = getSession(`owner-legacy:${userId}`, {
    userId: resource,
    auth: { userId, mode: 'legacy' },
    resource,
    ephemeral: true,
    isNew: true,
  })
  return useSession(s, onActivity)
}
