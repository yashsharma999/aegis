import { RefreshCw, CalendarX, BadgeDollarSign } from "lucide-react"
import { db } from "@/lib/db"
import type { Reminder, ReminderKind, ReminderStatus } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
    <Card className="rounded-2xl">
      <CardContent className="flex items-center gap-4 py-1">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <Icon className="size-5" />
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
      <div className="flex flex-col gap-3">
        {reminders.map((r) => (
          <ReminderRow key={r.id} reminder={r} />
        ))}
      </div>
    </div>
  )
}
