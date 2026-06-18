'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AlertsFeed } from '@/components/alerts-feed'
import type { Reminder } from '@/lib/types'

export function NotificationsBell({ reminders }: { reminders: Reminder[] }) {
  const actionable = reminders.filter((r) => r.status !== 'scheduled').length

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Notifications" />
        }
      >
        <Bell className="size-5" />
        {actionable > 0 ? (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-emergency text-[10px] font-semibold leading-none text-emergency-foreground">
            {actionable}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl p-3">
        <div className="flex items-center justify-between px-1 pb-2">
          <h2 className="font-serif text-base font-semibold">What needs you right now</h2>
          {actionable > 0 ? (
            <span className="text-xs text-muted-foreground">{actionable} need attention</span>
          ) : null}
        </div>
        {reminders.length > 0 ? (
          <AlertsFeed reminders={reminders} />
        ) : (
          <p className="px-1 py-6 text-center text-sm text-muted-foreground">
            You&apos;re all caught up. Nothing needs you right now.
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
