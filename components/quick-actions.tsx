import Link from 'next/link'
import { MessageCircleHeart, FilePlus2, CalendarCheck, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const actions = [
  {
    title: 'Ask the agent',
    description: 'Find anything in your vault',
    href: '/assistant',
    icon: MessageCircleHeart,
    accent: false,
  },
  {
    title: 'Add a document',
    description: 'Upload and tag a file',
    href: '/vault/documents',
    icon: FilePlus2,
    accent: true,
  },
  {
    title: 'Safety net',
    description: 'Check in & review escalation',
    href: '/settings/checkin',
    icon: CalendarCheck,
    accent: false,
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {actions.map((a) => {
        const Icon = a.icon
        return (
          <Link
            key={a.href}
            href={a.href}
            className={cn(
              'group relative flex flex-col gap-6 rounded-xl border bg-card p-5 transition-all duration-200',
              'hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)]',
            )}
          >
            <span
              className={cn(
                'flex size-10 items-center justify-center rounded-full border transition-colors',
                a.accent
                  ? 'border-accent/50 bg-accent/15 text-accent-foreground'
                  : 'border-border text-foreground/70 group-hover:border-foreground/30',
              )}
            >
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <span className="flex flex-col gap-1">
              <span className="font-medium leading-tight">{a.title}</span>
              <span className="text-sm leading-snug text-muted-foreground">{a.description}</span>
            </span>
            <ArrowUpRight className="absolute right-4 top-4 size-4 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground/70" />
          </Link>
        )
      })}
    </div>
  )
}
