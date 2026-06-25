// Public beneficiary entry to Legacy Mode. No login: the token in the URL is the
// credential. The vault only opens if the owner's vault is actually in `legacy`
// mode. The chat itself re-validates the token on every request via the Mastra
// middleware — this page just renders the right state.

import { Lock, Clock, ShieldCheck } from 'lucide-react'
import { resolveGrant } from '@/lib/access'
import { LegacyChat } from '@/components/assistant/legacy-chat'

export const metadata = { title: 'Aegis · Legacy access' }

export default async function LegacyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const grant = await resolveGrant(token)

  if (!grant.valid) {
    return (
      <Gate icon={<Lock className="size-6" />} title="This link isn't active">
        It may have been revoked or expired. Please ask whoever shared it with you for a new one.
      </Gate>
    )
  }

  if (!grant.legacyActive) {
    return (
      <Gate icon={<Clock className="size-6" />} title="This vault isn't open yet">
        {grant.ownerName}'s vault is still private. Access opens for you here if and when it's needed —
        you'll be able to return to this same link.
      </Gate>
    )
  }

  return (
    <div className="mx-auto flex h-dvh max-w-2xl flex-col px-4 py-6">
      <header className="mb-4 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full border border-accent/50 bg-accent/15 text-accent-foreground">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <h1 className="font-serif text-xl font-semibold tracking-tight">
            Hello{grant.beneficiaryName && grant.beneficiaryName !== 'there' ? `, ${grant.beneficiaryName}` : ''}
          </h1>
          <p className="text-sm text-muted-foreground">
            I'm Aegis. {grant.ownerName} set this up so you'd be looked after. Take your time.
          </p>
        </div>
      </header>
      <div className="min-h-0 flex-1 rounded-2xl border bg-card/40">
        <LegacyChat grantToken={token} ownerName={grant.ownerName} />
      </div>
    </div>
  )
}

function Gate({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full border bg-card text-muted-foreground">
          {icon}
        </span>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-pretty leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </div>
  )
}
