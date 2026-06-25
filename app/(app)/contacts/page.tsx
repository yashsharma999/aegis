import { Phone } from "lucide-react"
import { db } from "@/lib/db"
import { PageHeader } from "@/components/page-header"
import { ContactDialog } from "@/components/contact-dialog"
import { ConfirmDeleteButton } from "@/components/confirm-delete-button"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"

export const metadata = { title: "Contacts · Aegis" }

export default async function ContactsPage() {
  const contacts = await db.getContacts()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Key contacts"
        description="The people your family should call first, with context for why each one matters."
        action={<ContactDialog />}
      />
      {contacts.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Phone />
            </EmptyMedia>
            <EmptyTitle>No contacts saved</EmptyTitle>
            <EmptyDescription>
              Add the people your family should call first — your doctor, lawyer, and bank manager — with a note on why
              each one matters.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <ContactDialog />
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((c) => (
          <Card key={c.id} className="group rounded-xl transition-all duration-200 hover:border-foreground/20 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)]">
            <CardContent className="flex flex-col gap-2.5 py-1">
              <div className="flex items-start justify-between gap-2">
                <span className="font-serif text-lg font-semibold tracking-tight">{c.name}</span>
                <div className="flex items-center gap-1">
                  <span className="overline mt-1.5">{c.role}</span>
                  <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                    <ContactDialog contact={c} />
                    <ConfirmDeleteButton kind="contact" id={c.id} label={c.name} />
                  </div>
                </div>
              </div>
              <a
                href={`tel:${c.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Phone className="size-4" />
                {c.phone}
              </a>
              <p className="text-sm leading-relaxed text-muted-foreground">{c.notes}</p>
            </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
