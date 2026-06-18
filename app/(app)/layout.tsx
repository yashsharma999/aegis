import type { ReactNode } from 'react'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { ModeIndicator } from '@/components/mode-indicator'
import { NotificationsBell } from '@/components/notifications-bell'
import { PageTransition } from '@/components/page-transition'
import { db } from '@/lib/db'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [{ mode }, reminders, owner] = await Promise.all([
    db.getTriggerState(),
    db.getReminders(),
    db.getOwner(),
  ])

  return (
    <SidebarProvider>
      <AppSidebar owner={owner} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border/70 bg-background/75 px-4 backdrop-blur-md">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <span className="font-serif text-base font-semibold tracking-tight">Aegis</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Chief of staff for life
          </span>
          <div className="ml-auto flex items-center gap-2">
            <ModeIndicator mode={mode} />
            <NotificationsBell reminders={reminders} />
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-col px-4 py-10 sm:px-6 lg:px-10">
          <PageTransition>{children}</PageTransition>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
