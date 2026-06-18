import type { ReactNode } from 'react'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { ModeIndicator } from '@/components/mode-indicator'
import { NotificationsBell } from '@/components/notifications-bell'
import { db } from '@/lib/db'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [{ mode }, reminders] = await Promise.all([db.getTriggerState(), db.getReminders()])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <span className="font-serif text-sm font-medium">Aegis</span>
          <div className="ml-auto flex items-center gap-1.5">
            <ModeIndicator mode={mode} />
            <NotificationsBell reminders={reminders} />
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
