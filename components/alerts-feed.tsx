import { AlertTriangle, CalendarClock, CircleCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Reminder } from '@/lib/types'

function relativeDays(dateIso: string): string {
  const days = Math.round((new Date(dateIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days < 0) return `${Math.abs(days)} days overdue`
  if (days === 0) return 'due today'
  return `in ${days} days`
}

const statusMeta = {
  overdue: { label: 'Overdue', icon: AlertTriangle, tone: 'bg-emergency/12 border-emergency/25', text: 'text-emergency', badge: 'bg-emergency text-emergency-foreground' },
  due_soon: { label: 'Due soon', icon: CalendarClock, tone: 'bg-accent/20 border-accent/40', text: 'text-accent-foreground', badge: 'bg-accent text-accent-foreground' },
  scheduled: { label: 'Scheduled', icon: CircleCheck, tone: 'bg-muted border-border', text: 'text-muted-foreground', badge: 'bg-secondary text-secondary-foreground' },
} as const

export function AlertsFeed({ reminders }: { reminders: Reminder[] }) {
  const sorted = [...reminders].sort((a, b) => {
    const rank = { overdue: 0, due_soon: 1, scheduled: 2 }
    return rank[a.status] - rank[b.status]
  })

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((r) => {
        const meta = statusMeta[r.status]
        const Icon = meta.icon
        return (
          <div
            key={r.id}
            className={cn('flex items-center gap-3 rounded-2xl border p-4', meta.tone)}
          >
            <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full bg-background/70', meta.text)}>
              <Icon className="size-4.5" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{r.title}</span>
              <span className="truncate text-sm text-muted-foreground">
                {r.relatedTo} · {relativeDays(r.dueDate)}
              </span>
            </div>
            <Badge className={cn('ml-auto shrink-0 rounded-full border-transparent', meta.badge)}>
              {meta.label}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}
