import { ShieldCheck, Phone, CalendarClock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { POLICY_LABELS, type Policy } from "@/lib/types"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

export function PolicyCard({ policy }: { policy: Policy }) {
  return (
    <Card className="overflow-hidden rounded-2xl">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <Badge variant="secondary" className="w-fit">
              {POLICY_LABELS[policy.type]}
            </Badge>
            <CardTitle className="font-heading text-lg">{policy.provider}</CardTitle>
            <CardDescription className="font-mono text-xs">{policy.policyNumber}</CardDescription>
          </div>
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Coverage</span>
            <span className="font-heading text-lg text-foreground">{policy.coverageAmount}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Premium</span>
            <span className="font-heading text-lg text-foreground">{policy.premium}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarClock className="size-4 shrink-0" />
          <span>Renews {formatDate(policy.renewalDate)}</span>
        </div>

        {policy.networkHospitals?.length ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-foreground">Network hospitals</span>
            <div className="flex flex-wrap gap-1.5">
              {policy.networkHospitals.map((h) => (
                <Badge key={h} variant="outline" className="font-normal">
                  {h}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {policy.claimSteps?.length ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-foreground">How to claim</span>
            <ol className="flex flex-col gap-1 text-sm text-muted-foreground">
              {policy.claimSteps.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        <Separator />
        <div className="flex items-center gap-2 text-sm">
          <Phone className="size-4 shrink-0 text-primary" />
          <span className="text-muted-foreground">Claims:</span>
          <span className="font-medium text-foreground">{policy.claimContact}</span>
        </div>
      </CardContent>
    </Card>
  )
}
