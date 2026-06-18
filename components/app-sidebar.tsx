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
import { owner } from '@/lib/mock-data'

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
  { title: 'Wishes & instructions', href: '/vault/instructions', icon: ScrollText },
  { title: 'Key contacts', href: '/vault/contacts', icon: Phone },
]

const people: NavItem[] = [
  { title: 'People & access', href: '/vault/people', icon: Users },
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

export function AppSidebar() {
  const pathname = usePathname()
  const initials = owner.name
    .split(' ')
    .map((n) => n[0])
    .join('')

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2.5 px-2 py-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-serif text-lg font-semibold text-sidebar-foreground">Aegis</span>
            <span className="text-xs text-sidebar-foreground/60">Your chief of staff for life</span>
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
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium text-sidebar-foreground">{owner.name}</span>
            <span className="truncate text-xs text-sidebar-foreground/60">{owner.email}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
