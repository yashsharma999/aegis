'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Markdown } from '@/components/markdown'
import { ToolCall } from '@/components/tool-call'
import { useChatSession, type Bubble } from './chat-store'

const SUGGESTIONS = [
  'Summarize my health policy',
  'How do I file a claim?',
  "What's covered under my plan?",
]

// Owner chat — identity is the signed-in user.
export function AssistantChat({
  userId,
  onActivity,
}: {
  userId: string
  onActivity?: () => void
}) {
  const session = useChatSession(userId, onActivity)
  return (
    <ChatView
      session={session}
      suggestions={SUGGESTIONS}
      emptyHint="Ask anything about the documents in your vault."
      placeholder="Ask me anything in your vault…"
    />
  )
}

// Presentational chat surface, reused by the owner and the beneficiary (legacy)
// chats — both drive the SAME Mastra agent through the chat-store.
export function ChatView({
  session,
  suggestions = [],
  emptyHint,
  placeholder = 'Ask me anything…',
}: {
  session: { messages: Bubble[]; busy: boolean; send: (text: string) => void | Promise<void> }
  suggestions?: string[]
  emptyHint?: string
  placeholder?: string
}) {
  const { messages, busy, send } = session
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  function submit(text: string) {
    if (!text.trim() || busy) return
    setInput('')
    void send(text)
  }

  const lastMsg = messages[messages.length - 1]
  const waiting = busy && lastMsg?.from === 'agent' && lastMsg.parts.length === 0
  const visible = messages.filter((m) => m.parts.length > 0)
  const empty = visible.length === 0 && !busy

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-5 px-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <Avatar className="size-10">
                <AvatarFallback className="bg-accent text-accent-foreground">
                  <Sparkles className="size-5" />
                </AvatarFallback>
              </Avatar>
              {emptyHint ? <p className="max-w-sm text-sm text-muted-foreground">{emptyHint}</p> : null}
            </div>
            <div className="flex max-w-md flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => submit(s)}
                  className="cursor-pointer rounded-full border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          {visible.map((m) => (
            <MessageRow key={m.id} message={m} />
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

      <div className="p-3 sm:p-4">
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

function MessageRow({ message }: { message: Bubble }) {
  if (message.from === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
          {message.parts.map((p, i) => (p.type === 'text' ? <span key={i}>{p.text}</span> : null))}
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
      <div className="flex max-w-[82%] flex-col gap-2">
        {message.parts.map((part, i) =>
          part.type === 'text' ? (
            part.text ? (
              <div
                key={i}
                className="rounded-2xl rounded-tl-md border bg-card px-4 py-2.5 text-sm leading-relaxed"
              >
                <Markdown>{part.text}</Markdown>
              </div>
            ) : null
          ) : (
            <ToolCall key={`${part.id}-${i}`} name={part.name} args={part.args} result={part.result} done={part.done} />
          ),
        )}
      </div>
    </div>
  )
}
