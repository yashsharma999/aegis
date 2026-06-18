import { CheckCircle2, Circle } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { ReadinessRing } from '@/components/readiness-ring'
import { StatusCard } from '@/components/status-card'
import { QuickActions } from '@/components/quick-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db'
import { CATEGORY_LABELS, type DocumentCategory } from '@/lib/types'

export default async function DashboardPage() {
  const [documents, reminders, checkin, { mode }] = await Promise.all([
    db.getDocuments(),
    db.getReminders(),
    db.getCheckin(),
    db.getTriggerState(),
  ])

  const allCategories = Object.keys(CATEGORY_LABELS) as DocumentCategory[]
  const filled = new Set(documents.map((d) => d.category))
  const missing = allCategories.filter((c) => !filled.has(c))
  // Readiness blends category coverage with how many reminders are under control.
  const coverage = (filled.size / allCategories.length) * 70
  const onTrack = (reminders.filter((r) => r.status !== 'overdue').length / Math.max(reminders.length, 1)) * 30
  const readiness = Math.round(coverage + onTrack)

  return (
    <>
      <PageHeader
        title="Welcome back"
        description="Everything you'd ever need to find, file, or hand over — in one calm place."
      />

      <section className="grid gap-5 lg:grid-cols-3">
        <Card className="rounded-3xl lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Vault readiness</CardTitle>
            <CardDescription>How prepared your vault is across every category.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center pb-8">
            <ReadinessRing value={readiness} />
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <StatusCard mode={mode} checkin={checkin} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-xl font-semibold">Quick actions</h2>
        <QuickActions />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-xl font-semibold">What&apos;s still missing</h2>
        <Card className="rounded-3xl">
          <CardContent className="flex flex-col gap-1 py-2">
            {allCategories.map((c) => {
              const has = filled.has(c)
              return (
                <div
                  key={c}
                  className="flex items-center gap-3 border-b py-3 last:border-0"
                >
                  {has ? (
                    <CheckCircle2 className="size-5 text-success" />
                  ) : (
                    <Circle className="size-5 text-muted-foreground/40" />
                  )}
                  <span className={has ? 'font-medium' : 'text-muted-foreground'}>
                    {CATEGORY_LABELS[c]}
                  </span>
                  <span className="ml-auto text-sm text-muted-foreground">
                    {has ? 'Covered' : 'Nothing added yet'}
                  </span>
                </div>
              )
            })}
            {missing.length === 0 ? (
              <p className="py-3 text-sm text-success">Every category has at least one item. Beautifully prepared.</p>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </>
  )
}
