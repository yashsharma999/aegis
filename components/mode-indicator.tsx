import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { MODE_LABELS, type AppMode } from '@/lib/types'

const styles: Record<AppMode, string> = {
  everyday: 'bg-success/15 text-success border-success/30',
  emergency: 'bg-emergency/15 text-emergency border-emergency/30',
  incapacity: 'bg-accent/30 text-accent-foreground border-accent/50',
  legacy: 'bg-primary/10 text-primary border-primary/25',
}

const dot: Record<AppMode, string> = {
  everyday: 'bg-success',
  emergency: 'bg-emergency animate-pulse',
  incapacity: 'bg-accent-foreground',
  legacy: 'bg-primary',
}

export function ModeIndicator({ mode }: { mode: AppMode }) {
  return (
    <Badge variant="outline" className={cn('gap-1.5 rounded-full px-3 py-1', styles[mode])}>
      <span className={cn('size-1.5 rounded-full', dot[mode])} />
      {MODE_LABELS[mode]} mode
    </Badge>
  )
}
