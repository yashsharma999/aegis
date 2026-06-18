import { Phone, Siren, UserRound, ShieldPlus } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { MedicalIdCard } from '@/components/medical-id-card'
import { ShareAccessButton } from '@/components/share-access-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { db } from '@/lib/db'

export default async function EmergencyPage() {
  const [profile, policies, contacts, beneficiaries] = await Promise.all([
    db.getMedicalProfile(),
    db.getPolicies(),
    db.getContacts(),
    db.getBeneficiaries(),
  ])
  const hasMedicalId = profile.bloodGroup !== ''
  const healthPolicy = policies.find((p) => p.id === profile.activeHealthPolicyId)
  const primary = beneficiaries.find((b) => b.relationship === 'Wife')

  const emergencyContacts = [
    ...(primary
      ? [{ name: primary.name, role: 'Primary emergency contact', phone: primary.whatsapp }]
      : []),
    ...contacts
      .filter((c) => c.role.toLowerCase().includes('doctor'))
      .map((c) => ({ name: c.name, role: c.role, phone: c.phone })),
  ]

  return (
    <>
      <div className="flex items-center gap-3 rounded-xl border border-emergency/30 bg-emergency/10 px-4 py-3 text-emergency">
        <Siren className="size-5 shrink-0" />
        <p className="text-sm font-medium">
          Emergency mode shows only what first responders and trusted contacts need — readable at a glance.
        </p>
      </div>

      <PageHeader
        eyebrow="Break-glass"
        title="Emergency mode"
        description="Break-glass medical ID and insurance details for a crisis. Accessible by you or a trusted contact."
        action={<ShareAccessButton />}
      />

      {!hasMedicalId || !healthPolicy ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShieldPlus />
            </EmptyMedia>
            <EmptyTitle>No medical ID yet</EmptyTitle>
            <EmptyDescription>
              Add your blood group, allergies, medications and active health cover. In a crisis, this break-glass card is
              what first responders and your trusted contacts will reach for.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <MedicalIdCard profile={profile} healthPolicy={healthPolicy} />
        </div>

        <div className="flex flex-col gap-5 lg:col-span-2">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="size-4.5 text-emergency" />
                Call right now
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {emergencyContacts.map((c) => (
                <a
                  key={c.phone}
                  href={`tel:${c.phone.replace(/\s/g, '')}`}
                  className="flex items-center gap-3 rounded-2xl border p-3 transition-colors hover:border-emergency/40 hover:bg-emergency/5"
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                    <UserRound className="size-5" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{c.name}</span>
                    <span className="truncate text-sm text-muted-foreground">{c.role}</span>
                  </span>
                  <span className="ml-auto text-sm font-medium text-emergency">{c.phone}</span>
                </a>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl bg-secondary/40">
            <CardContent className="py-5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Note for responders: </span>
                {profile.emergencyNote}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      )}
    </>
  )
}
