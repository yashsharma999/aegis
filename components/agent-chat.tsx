'use client'

import { useRef, useState, useTransition } from 'react'
import { FileText, Send, ShieldCheck, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { sendAgentMessage } from '@/lib/actions'
import type { AppMode } from '@/lib/types'

export interface ChatBubble {
  id: string
  from: 'agent' | 'user' | 'family'
  text: string
  sourceDoc?: string
}

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
  const [isPending, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)

  function scrollToBottom() {
    requestAnimationFrame(() => {
      const el = scrollRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
  }

  function submit(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isPending) return
    const userMsg: ChatBubble = { id: crypto.randomUUID(), from: 'user', text: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    scrollToBottom()

    startTransition(async () => {
      const reply = await sendAgentMessage(trimmed, mode, familyName)
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          from: mode === 'legacy' ? 'agent' : 'agent',
          text: reply.text,
          sourceDoc: reply.sourceDoc,
        },
      ])
      scrollToBottom()
    })
  }

  const isPhone = variant === 'phone'

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="flex flex-col gap-4 p-4 sm:p-5">
          {messages.map((m) => (
            <MessageRow key={m.id} message={m} isPhone={isPhone} />
          ))}
          {isPending ? (
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
      </ScrollArea>

      <div className="border-t bg-card/60 p-3 sm:p-4">
        {suggestions.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => submit(s)}
                disabled={isPending}
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
          <Button type="submit" size="icon" className="size-11 shrink-0 rounded-full" disabled={isPending || !input.trim()}>
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
        <div className="whitespace-pre-line rounded-2xl rounded-tl-md border bg-card px-4 py-2.5 text-sm leading-relaxed">
          {message.text}
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
