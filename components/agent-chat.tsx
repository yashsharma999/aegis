'use client'

import { useRef, useState } from 'react'
import { FileText, Send, ShieldCheck, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Markdown } from '@/components/markdown'
import { ToolCall } from '@/components/tool-call'
import { cn } from '@/lib/utils'
import type { AppMode } from '@/lib/types'

// An assistant turn is an ordered list of text and tool-call parts, built live
// from the NDJSON stream. Simple bubbles (user, seed greeting) just use `text`.
export type ChatPart =
  | { type: 'text'; text: string }
  | { type: 'tool'; id: string; name: string; done: boolean }

export interface ChatBubble {
  id: string
  from: 'agent' | 'user' | 'family'
  text: string
  parts?: ChatPart[]
  sourceDoc?: string
}

type Frame =
  | { t: 'text'; v: string }
  | { t: 'tool'; id: string; name: string }
  | { t: 'tool-done'; id: string }

export function AgentChat({
  mode,
  familyName,
  initialMessages,
  suggestions = [],
  placeholder = 'Ask me anything in your vault…',
  variant = 'default',
}: {
  mode: AppMode
  familyName?: string
  initialMessages: ChatBubble[]
  suggestions?: string[]
  placeholder?: string
  variant?: 'default' | 'phone'
}) {
  const [messages, setMessages] = useState<ChatBubble[]>(initialMessages)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  function scrollToBottom() {
    requestAnimationFrame(() => {
      const el = scrollRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
  }

  async function submit(text: string) {
    const trimmed = text.trim()
    if (!trimmed || busy) return

    const userMsg: ChatBubble = { id: crypto.randomUUID(), from: 'user', text: trimmed }
    const agentId = crypto.randomUUID()
    // History for the agent (exclude the empty placeholder we're about to add).
    const history = [...messages, userMsg].map((m) => ({
      role: m.from === 'agent' ? ('assistant' as const) : ('user' as const),
      content: m.text,
    }))

    setMessages((prev) => [...prev, userMsg, { id: agentId, from: 'agent', text: '', parts: [] }])
    setInput('')
    setBusy(true)
    scrollToBottom()

    const apply = (frame: Frame) =>
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== agentId) return m
          const parts = [...(m.parts ?? [])]
          if (frame.t === 'text') {
            const last = parts[parts.length - 1]
            if (last?.type === 'text') parts[parts.length - 1] = { ...last, text: last.text + frame.v }
            else parts.push({ type: 'text', text: frame.v })
          } else if (frame.t === 'tool') {
            parts.push({ type: 'tool', id: frame.id, name: frame.name, done: false })
          } else if (frame.t === 'tool-done') {
            for (let k = parts.length - 1; k >= 0; k--) {
              const p = parts[k]
              if (p.type === 'tool' && p.id === frame.id) {
                parts[k] = { ...p, done: true }
                break
              }
            }
          }
          return { ...m, parts }
        }),
      )

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, familyName, messages: history }),
      })
      if (!res.ok || !res.body) {
        const msg = res.status === 401 ? 'Please sign in again to use the assistant.' : 'Sorry, something went wrong.'
        apply({ t: 'text', v: msg })
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      const drain = (flush = false) => {
        let nl: number
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim()
          buf = buf.slice(nl + 1)
          if (line) try { apply(JSON.parse(line) as Frame) } catch {}
        }
        if (flush && buf.trim()) {
          try { apply(JSON.parse(buf.trim()) as Frame) } catch {}
          buf = ''
        }
      }
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        drain()
        scrollToBottom()
      }
      drain(true)
    } catch {
      apply({ t: 'text', v: 'Sorry, something went wrong.' })
    } finally {
      setBusy(false)
      scrollToBottom()
    }
  }

  const isPhone = variant === 'phone'
  const lastMsg = messages[messages.length - 1]
  const waiting = busy && lastMsg?.from === 'agent' && lastMsg.text === '' && (lastMsg.parts?.length ?? 0) === 0

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          {messages
            .filter((m) => m.text !== '' || (m.parts?.length ?? 0) > 0)
            .map((m) => (
              <MessageRow key={m.id} message={m} isPhone={isPhone} />
            ))}
          {waiting ? (
            <div className="flex items-center gap-2 pl-11 text-sm text-muted-foreground">
              <span className="flex gap-1">
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.2s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.1s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
              </span>
              thinking…
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t bg-card/60 p-3 sm:p-4">
        {suggestions.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => submit(s)}
                disabled={busy}
                className="rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit(input)
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="h-11 flex-1 rounded-full border bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <Button type="submit" size="icon" className="size-11 shrink-0 rounded-full" disabled={busy || !input.trim()}>
            <Send className="size-4.5" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  )
}

function MessageRow({ message, isPhone }: { message: ChatBubble; isPhone: boolean }) {
  const isUser = message.from === 'user' || message.from === 'family'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
          {message.text}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className="bg-accent text-accent-foreground">
          <Sparkles className="size-4" />
        </AvatarFallback>
      </Avatar>
      <div className={cn('flex max-w-[82%] flex-col gap-2', isPhone && 'max-w-[88%]')}>
        <div className="rounded-2xl rounded-tl-md border bg-card px-4 py-2.5 text-sm leading-relaxed">
          {message.parts && message.parts.length > 0 ? (
            message.parts.map((part, i) =>
              part.type === 'text' ? (
                <Markdown key={i}>{part.text}</Markdown>
              ) : (
                <ToolCall key={`${part.id}-${i}`} name={part.name} done={part.done} />
              ),
            )
          ) : (
            <Markdown>{message.text}</Markdown>
          )}
        </div>
        {message.sourceDoc ? (
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
            <FileText className="size-3" />
            Source: {message.sourceDoc}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export { ShieldCheck }
