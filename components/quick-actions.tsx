import Link from 'next/link'
import { MessageCircleHeart, FilePlus2, Siren, BellRing } from 'lucide-react'
import { cn } from '@/lib/utils'

const actions = [
  {
    title: 'Ask the agent',
    description: 'Find anything in your vault',
    href: '/assistant',
    icon: MessageCircleHeart,
    tone: 'hover:border-primary/40',
  },
  {
    title: 'Add a document',
    description: 'Upload and tag a file',
    href: '/vault/documents',
    icon: FilePlus2,
    tone: 'hover:border-accent/60',
  },
  {
    title: 'Renewal radar',
    description: 'See what needs attention',
    href: '/reminders',
    icon: BellRing,
    tone: 'hover:border-primary/40',
  },
  {
    title: 'Emergency mode',
    description: 'Break-glass medical ID',
    href: '/emergency',
    icon: Siren,
    tone: 'hover:border-emergency/50',
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {actions.map((a) => {
        const Icon = a.icon
        return (
          <Link
            key={a.href}
            href={a.href}
            className={cn(
              'group flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-colors',
              a.tone,
            )}
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <Icon className="size-5" />
            </span>
            <span className="flex flex-col">
              <span className="font-medium">{a.title}</span>
              <span className="text-sm text-muted-foreground">{a.description}</span>
            </span>
          </Link>
        )
      })}
    </div>
  )
}
