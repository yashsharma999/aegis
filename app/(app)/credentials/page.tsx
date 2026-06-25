import { KeyRound, Lock, ExternalLink } from "lucide-react"
import { db } from "@/lib/db"
import { PageHeader } from "@/components/page-header"
import { CredentialDialog } from "@/components/credential-dialog"
import { ConfirmDeleteButton } from "@/components/confirm-delete-button"
import { RevealSecret } from "@/components/reveal-secret"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"

export const metadata = { title: "Credentials · Aegis" }

export default async function CredentialsPage() {
  const credentials = await db.getCredentials()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Credentials"
        description="Logins and account secrets, kept in your private vault. These are shielded from the agent — it can never read or surface them."
        action={<CredentialDialog />}
      />
      {credentials.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <KeyRound />
            </EmptyMedia>
            <EmptyTitle>No credentials saved</EmptyTitle>
            <EmptyDescription>
              Store logins, account numbers and PINs your family would otherwise be locked out of. Only you can open
              these — the agent has no access.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CredentialDialog />
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {credentials.map((c) => (
            <Card key={c.id} className="group rounded-xl transition-all duration-200 hover:border-foreground/20">
              <CardContent className="flex flex-col gap-2.5 py-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex items-center gap-2 font-serif text-lg font-semibold tracking-tight">
                    <Lock className="size-4 text-muted-foreground" />
                    {c.label}
                  </span>
                  <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                    <CredentialDialog credential={c} />
                    <ConfirmDeleteButton kind="credential" id={c.id} label={c.label} />
                  </div>
                </div>
                {c.username ? (
                  <div className="text-sm text-muted-foreground">
                    <span className="overline">User</span> {c.username}
                  </div>
                ) : null}
                {c.secret ? <RevealSecret value={c.secret} /> : null}
                {c.url ? (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <ExternalLink className="size-3.5" />
                    Open site
                  </a>
                ) : null}
                {c.notes ? <p className="text-sm leading-relaxed text-muted-foreground">{c.notes}</p> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
