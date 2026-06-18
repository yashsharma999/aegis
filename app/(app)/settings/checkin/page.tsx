import { CalendarCheck, ShieldCheck, Bell } from "lucide-react"
import { db } from "@/lib/db"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { CheckinConfirmButton } from "@/components/checkin-confirm-button"

export const metadata = { title: "Check-in · Aegis" }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default async function CheckinSettingsPage() {
  const checkin = await db.getCheckin()
  const remaining = checkin.threshold - checkin.missedCount
  const pct = (remaining / checkin.threshold) * 100

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Settings"
        title="Check-in & safety net"
        description="The dead man's switch. Regular check-ins keep your vault dormant; silence escalates access carefully."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="size-4.5 text-primary" />
              Your check-in
            </CardTitle>
            <CardDescription>Confirm you&apos;re well to reset the timer.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Buffer remaining</span>
                <span>
                  {remaining} of {checkin.threshold}
                </span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Cadence</span>
              <span className="font-medium">Every {checkin.cadenceDays} days</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Last check-in</span>
              <span className="font-medium">{formatDate(checkin.lastCheckinAt)}</span>
            </div>
            <CheckinConfirmButton />
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4.5 text-primary" />
              How escalation works
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
            <div className="flex gap-3">
              <Bell className="mt-0.5 size-4 shrink-0 text-accent-foreground" />
              <p>
                <span className="font-medium text-foreground">Missed check-ins</span> trigger gentle WhatsApp nudges to
                you first — most are resolved here.
              </p>
            </div>
            <Separator />
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent-foreground" />
              <p>
                <span className="font-medium text-foreground">Threshold reached</span> moves the vault to a
                pre-triggered state and asks your executor to confirm.
              </p>
            </div>
            <Separator />
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent-foreground" />
              <p>
                <span className="font-medium text-foreground">Only after confirmation</span> does Legacy mode begin,
                releasing scoped access to verified beneficiaries.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
