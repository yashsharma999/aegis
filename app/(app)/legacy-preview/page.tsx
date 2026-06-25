import { HeartHandshake } from 'lucide-react'
import { getSessionUser } from '@/lib/session'
import { PageHeader } from '@/components/page-header'
import { LegacyPreview } from '@/components/assistant/legacy-preview'

export const metadata = { title: 'Legacy preview · Aegis' }

export default async function LegacyPreviewPage() {
  const user = await getSessionUser()
  if (!user) return null

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[520px] flex-col gap-4">
      <PageHeader
        title="Legacy preview"
        description="Step into your beneficiary's shoes. Aegis answers from your real vault, the way it would for them once Legacy Mode is active — no scripts, no mock data."
      />
      <div className="flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-muted-foreground">
        <HeartHandshake className="size-4 shrink-0 text-accent-foreground" />
        Preview only — your beneficiaries reach this through their own access link, and only after the vault enters Legacy Mode.
      </div>
      <div className="min-h-0 flex-1 rounded-2xl border bg-card/40">
        <LegacyPreview userId={user.id} />
      </div>
    </div>
  )
}
