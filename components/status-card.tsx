import Link from 'next/link'
import { HeartPulse, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card className="rounded-3xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <HeartPulse className="size-4.5 text-primary" />
            Life-status switch
          </CardTitle>
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
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {healthy
            ? `All calm. You check in every ${checkin.cadenceDays} days. Your safety net is active and nothing will trigger without your confirmation.`
            : `Heads up — your check-in window has advanced. ${checkin.missedCount} of ${checkin.threshold} missed. If the threshold is reached, your executor is asked to confirm before any access is granted.`}
        </p>
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Check-in buffer</span>
            <span>
              {checkin.threshold - checkin.missedCount} of {checkin.threshold} remaining
            </span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="size-4" />
            Last check-in
          </span>
          <span className="font-medium">{formatDate(checkin.lastCheckinAt)}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          nativeButton={false}
          render={<Link href="/settings/checkin">Manage check-in</Link>}
        />
      </CardContent>
    </Card>
  )
}
