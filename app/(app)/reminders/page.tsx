import { RefreshCw, CalendarX, BadgeDollarSign, BellRing } from "lucide-react"
import { db } from "@/lib/db"
import type { Reminder, ReminderKind, ReminderStatus } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"

export const metadata = { title: "Reminders · Aegis" }

const KIND_ICON: Record<ReminderKind, typeof RefreshCw> = {
  renewal: RefreshCw,
  expiry: CalendarX,
  premium: BadgeDollarSign,
}

const STATUS: Record<ReminderStatus, { label: string; className: string }> = {
  overdue: { label: "Overdue", className: "bg-emergency text-emergency-foreground" },
  due_soon: { label: "Due soon", className: "bg-accent text-accent-foreground" },
  scheduled: { label: "Scheduled", className: "bg-secondary text-secondary-foreground" },
}

function daysUntil(iso: string) {
  const d = Math.round((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (d < 0) return `${Math.abs(d)} days ago`
  if (d === 0) return "Today"
  return `in ${d} days`
}

function ReminderRow({ reminder }: { reminder: Reminder }) {
  const Icon = KIND_ICON[reminder.kind]
  const status = STATUS[reminder.status]
  return (
    <Card className="rounded-xl transition-colors hover:border-foreground/20">
      <CardContent className="flex items-center gap-4 py-1">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-foreground/70">
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="font-medium leading-snug text-balance">{reminder.title}</span>
          <span className="font-mono text-xs text-muted-foreground">{reminder.relatedTo}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge className={status.className}>{status.label}</Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(reminder.dueDate).toLocaleDateString(undefined, { day: "numeric", month: "short" })} ·{" "}
            {daysUntil(reminder.dueDate)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function RemindersPage() {
  const reminders = await db.getReminders()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Renewal radar"
        description="Your agent watches every expiry date and nudges you on WhatsApp before anything lapses."
      />
      {reminders.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BellRing />
            </EmptyMedia>
            <EmptyTitle>Nothing on the radar</EmptyTitle>
            <EmptyDescription>
              As you add policies and documents with expiry dates, renewals and premiums will appear here — and Aegis
              will nudge you before anything lapses.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {reminders.map((r) => (
            <ReminderRow key={r.id} reminder={r} />
          ))}
        </div>
      )}
    </div>
  )
}
