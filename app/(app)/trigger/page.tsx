import Link from 'next/link'
import { HeartHandshake } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { TriggerConsole } from '@/components/trigger-console'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db'

export default async function TriggerPage() {
  const state = await db.getTriggerState()

  return (
    <>
      <PageHeader
        title="Demo controls"
        description="Drive the mode/state machine: Everyday → Emergency → Incapacity → Pre-triggered → Awaiting Executor → Legacy Activated. Every transition is logged."
        action={
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link href="/legacy-preview">
                <HeartHandshake data-icon="inline-start" />
                Open legacy preview
              </Link>
            }
          />
        }
      />
      <TriggerConsole initialState={state} />
    </>
  )
}
