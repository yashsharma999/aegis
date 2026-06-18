'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ShieldCheck,
  LayoutDashboard,
  MessageCircleHeart,
  Siren,
  FileText,
  ShieldQuestion,
  BellRing,
  Users,
  ScrollText,
  Phone,
  Timer,
  SlidersHorizontal,
  HeartHandshake,
  LogOut,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth'
import type { Owner } from '@/lib/types'

type NavItem = { title: string; href: string; icon: React.ElementType }

const everyday: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Ask the agent', href: '/assistant', icon: MessageCircleHeart },
  { title: 'Renewal radar', href: '/reminders', icon: BellRing },
]

const emergency: NavItem[] = [
  { title: 'Emergency mode', href: '/emergency', icon: Siren },
]

const vault: NavItem[] = [
  { title: 'Documents', href: '/vault/documents', icon: FileText },
  { title: 'Insurance', href: '/vault/policies', icon: ShieldQuestion },
  { title: 'Wishes & instructions', href: '/instructions', icon: ScrollText },
  { title: 'Key contacts', href: '/contacts', icon: Phone },
]

const people: NavItem[] = [
  { title: 'People & access', href: '/people', icon: Users },
]

const settings: NavItem[] = [
  { title: 'Check-in switch', href: '/settings/checkin', icon: Timer },
]

const demo: NavItem[] = [
  { title: 'Demo controls', href: '/trigger', icon: SlidersHorizontal },
  { title: 'Legacy preview', href: '/family', icon: HeartHandshake },
]

function NavSection({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={active}
                  tooltip={item.title}
                  render={
                    <Link href={item.href}>
                      <Icon />
                      <span>{item.title}</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar({ owner }: { owner: Owner }) {
  const pathname = usePathname()
  const displayName = owner.name || owner.email.split('@')[0] || 'You'
  const initials = displayName
    .split(/[\s._-]+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-3 px-2 py-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground ring-1 ring-inset ring-sidebar-primary/40">
            <ShieldCheck className="size-5" />
          </span>
          <span className="flex flex-col gap-1 leading-none">
            <span className="font-serif text-lg font-semibold tracking-tight text-sidebar-foreground">
              Aegis
            </span>
            <span className="text-[0.625rem] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/55">
              Chief of staff for life
            </span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavSection label="Everyday" items={everyday} pathname={pathname} />
        <NavSection label="Emergency" items={emergency} pathname={pathname} />
        <NavSection label="Vault" items={vault} pathname={pathname} />
        <NavSection label="People" items={people} pathname={pathname} />
        <NavSection label="Settings" items={settings} pathname={pathname} />
        <NavSection label="Demo" items={demo} pathname={pathname} />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/60 p-2.5">
          <Avatar className="size-9">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-sm font-medium text-sidebar-foreground">{displayName}</span>
            <span className="truncate text-xs text-sidebar-foreground/60">{owner.email}</span>
          </div>
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="size-8 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
