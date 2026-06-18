import Link from 'next/link'
import { HeartPulse, ShieldCheck, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { MODE_LABELS, type AppMode, type CheckinConfig } from '@/lib/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function StatusCard({ mode, checkin }: { mode: AppMode; checkin: CheckinConfig }) {
  const healthy = mode === 'everyday' && checkin.missedCount === 0
  const pct = ((checkin.threshold - checkin.missedCount) / checkin.threshold) * 100

  return (
    <Card className="flex h-full flex-col justify-between rounded-xl p-6">
      <CardContent className="flex flex-col gap-5 p-0">
        <div className="flex items-start justify-between gap-4">
          <h3 className="flex items-center gap-2 font-serif text-2xl font-semibold tracking-tight">
            <HeartPulse className="size-5 text-accent-foreground" strokeWidth={1.75} />
            {healthy ? 'Your safety net is active' : 'Check-in window advanced'}
          </h3>
          <Badge
            variant="outline"
            className={
              healthy
                ? 'rounded-full border-success/30 bg-success/15 text-success'
                : 'rounded-full border-emergency/30 bg-emergency/15 text-emergency'
            }
          >
            {MODE_LABELS[mode]}
          </Badge>
        </div>

        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          {healthy
            ? `All calm. You check in every ${checkin.cadenceDays} days, and nothing will ever trigger without your confirmation.`
            : `${checkin.missedCount} of ${checkin.threshold} check-ins missed. If the threshold is reached, your executor is asked to confirm before any access is granted.`}
        </p>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Check-in buffer</span>
            <span className="font-medium tabular-nums text-foreground">
              {checkin.threshold - checkin.missedCount} of {checkin.threshold} remaining
            </span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="size-4" strokeWidth={1.75} />
            Last check-in
          </span>
          <span className="font-medium tabular-nums">{formatDate(checkin.lastCheckinAt)}</span>
        </div>
      </CardContent>

      <Button
        variant="outline"
        className="mt-6 w-fit gap-1.5 rounded-full"
        nativeButton={false}
        render={
          <Link href="/settings/checkin">
            Manage check-in
            <ArrowRight className="size-4" />
          </Link>
        }
      />
    </Card>
  )
}
