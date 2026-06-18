import { CheckCircle2, Clock, ShieldUser, MessageCircle, Users } from "lucide-react"
import { db } from "@/lib/db"
import { CATEGORY_LABELS } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"

export const metadata = { title: "People · Aegis" }

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
}

export default async function PeoplePage() {
  const [beneficiaries, guardians] = await Promise.all([db.getBeneficiaries(), db.getGuardians()])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="People & access"
        description="Who can reach your vault, how they prove it's them, and exactly what they can see."
      />

      {beneficiaries.length === 0 && guardians.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>No people added yet</EmptyTitle>
            <EmptyDescription>
              Add the beneficiaries who can access your vault, set what each one can see, and name an executor to
              confirm before anything is released.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">Beneficiaries</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {beneficiaries.map((b) => (
            <Card key={b.id} className="rounded-xl transition-colors hover:border-foreground/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="size-11">
                    <AvatarFallback className="bg-primary/10 text-primary">{initials(b.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <CardTitle className="text-base">{b.name}</CardTitle>
                    <CardDescription>{b.relationship}</CardDescription>
                  </div>
                  {b.status === "verified" ? (
                    <Badge className="gap-1 bg-success text-success-foreground">
                      <CheckCircle2 className="size-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="size-3" />
                      Pending
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="size-4 shrink-0" />
                  <span className="font-mono">{b.whatsapp}</span>
                </div>
                <Separator />
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-muted-foreground">Can access in Legacy mode</span>
                  <div className="flex flex-wrap gap-1.5">
                    {b.accessScope.map((scope) => (
                      <Badge key={scope} variant="secondary" className="font-normal">
                        {CATEGORY_LABELS[scope]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">Guardians &amp; executor</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {guardians.map((g) => (
            <Card key={g.id} className="rounded-xl transition-colors hover:border-foreground/20">
              <CardContent className="flex items-center gap-3 py-1">
                <span className="flex size-11 items-center justify-center rounded-full border border-accent/50 bg-accent/15 text-accent-foreground">
                  <ShieldUser className="size-5" strokeWidth={1.75} />
                </span>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="font-medium">{g.name}</span>
                  <span className="text-sm text-muted-foreground">{g.relationship}</span>
                </div>
                <Badge variant="outline">{g.role === "executor" ? "Executor" : "Temporary guardian"}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
        </>
      )}
    </div>
  )
}
