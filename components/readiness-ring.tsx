import { cn } from '@/lib/utils'

export function ReadinessRing({
  value,
  size = 168,
  label = 'Vault readiness',
}: {
  value: number
  size?: number
  label?: string
}) {
  const stroke = 12
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-4xl font-semibold">{value}%</span>
          <span className="text-xs text-muted-foreground">ready</span>
        </div>
      </div>
      <span className={cn('text-sm font-medium text-muted-foreground')}>{label}</span>
    </div>
  )
}
