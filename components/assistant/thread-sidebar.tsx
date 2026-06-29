'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Plus, MessageSquare, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { listThreads, deleteThread, type ThreadRow } from '@/lib/agent-transport'
import { threadIdFromPath } from './chat-store'

export function ThreadSidebar({
  userId,
  refreshKey,
  onSelect,
  onNew,
}: {
  userId: string
  refreshKey: number
  onSelect: (id: string) => void
  onNew: () => void
}) {
  const activeThreadId = threadIdFromPath(usePathname())
  const [threads, setThreads] = useState<ThreadRow[] | null>(null)

  const refresh = useCallback(async () => {
    try {
      setThreads(await listThreads({ userId }))
    } catch {
      setThreads([])
    }
  }, [userId])

  useEffect(() => {
    void refresh()
  }, [refresh, refreshKey])

  const remove = async (id: string) => {
    try {
      await deleteThread({ userId }, id)
      if (id === activeThreadId) onNew()
      void refresh()
    } catch {
      void refresh()
    }
  }

  return (
    <div className="flex h-full w-60 shrink-0 flex-col rounded-xl bg-secondary/40">
      <div className="p-3">
        <Button type="button" variant="outline" className="w-full justify-start" onClick={onNew} data-icon="inline-start">
          <Plus className="size-4" />
          New chat
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {threads === null ? (
          <div className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Loading…
          </div>
        ) : threads.length === 0 ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">No past conversations yet.</p>
        ) : (
          threads.map((t) => (
            <div
              key={t.id}
              className={cn(
                'group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-secondary',
                t.id === activeThreadId && 'bg-secondary',
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(t.id)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{t.title || 'New conversation'}</span>
              </button>
              <button
                type="button"
                aria-label="Delete conversation"
                onClick={() => remove(t.id)}
                className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
