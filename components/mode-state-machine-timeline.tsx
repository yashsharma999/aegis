import { cn } from '@/lib/utils'
import type { TimelineEvent } from '@/lib/types'

export function ModeStateMachineTimeline({ timeline }: { timeline: TimelineEvent[] }) {
  const reversed = [...timeline].reverse()
  return (
    <ol className="relative flex flex-col">
      {reversed.map((e, i) => {
        const isLatest = i === 0
        return (
          <li key={`${e.at}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
            {/* connector line */}
            {i < reversed.length - 1 ? (
              <span className="absolute top-4 left-[7px] h-full w-px bg-border" />
            ) : null}
            <span
              className={cn(
                'relative z-10 mt-1 size-3.5 shrink-0 rounded-full border-2',
                isLatest
                  ? 'border-accent bg-accent'
                  : 'border-muted-foreground/30 bg-background',
              )}
            />
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className={cn('font-medium', isLatest && 'text-foreground')}>{e.state}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(e.at).toLocaleString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{e.note}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
