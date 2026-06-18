import { Droplet, Pill, TriangleAlert, Activity, Hospital, ShieldPlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MedicalProfile, Policy } from '@/lib/types'

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-emergency/15 py-4 last:border-0">
      <span className="flex items-center gap-2 text-sm font-medium text-emergency">
        <Icon className="size-4" />
        {label}
      </span>
      <div className="pl-6">{children}</div>
    </div>
  )
}

export function MedicalIdCard({
  profile,
  healthPolicy,
}: {
  profile: MedicalProfile
  healthPolicy: Policy
}) {
  return (
    <Card className="overflow-hidden rounded-3xl border-emergency/30 bg-emergency-muted/40">
      <CardHeader className="border-b border-emergency/20 bg-emergency/10">
        <CardTitle className="flex items-center gap-2 text-emergency">
          <ShieldPlus className="size-5" />
          Emergency Medical ID
        </CardTitle>
      </CardHeader>
      <CardContent className="py-1">
        <Row icon={Droplet} label="Blood group">
          <span className="font-serif text-3xl font-semibold text-foreground">{profile.bloodGroup}</span>
        </Row>
        <Row icon={TriangleAlert} label="Critical allergies — do not administer">
          <div className="flex flex-wrap gap-2">
            {profile.allergies.map((a) => (
              <span
                key={a}
                className="rounded-full border border-emergency/40 bg-emergency px-3 py-1 text-sm font-medium text-emergency-foreground"
              >
                {a}
              </span>
            ))}
          </div>
        </Row>
        <Row icon={Pill} label="Current medications">
          <ul className="flex flex-col gap-1 text-sm">
            {profile.medications.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Row>
        <Row icon={Activity} label="Conditions">
          <div className="flex flex-wrap gap-2">
            {profile.conditions.map((c) => (
              <span key={c} className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                {c}
              </span>
            ))}
          </div>
        </Row>
        <Row icon={Hospital} label="Health cover for admission">
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium">
              {healthPolicy.provider} — {healthPolicy.policyNumber}
            </span>
            <span className="text-muted-foreground">{healthPolicy.coverageAmount}</span>
            <span className="text-muted-foreground">Preferred hospital: {profile.preferredHospital}</span>
          </div>
        </Row>
      </CardContent>
    </Card>
  )
}
