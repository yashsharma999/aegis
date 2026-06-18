import { Phone } from "lucide-react"
import { db } from "@/lib/db"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = { title: "Contacts · Aegis" }

export default async function ContactsPage() {
  const contacts = await db.getContacts()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Key contacts"
        description="The people your family should call first, with context for why each one matters."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {contacts.map((c) => (
          <Card key={c.id} className="rounded-2xl">
            <CardContent className="flex flex-col gap-2 py-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.role}</span>
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
    </div>
  )
}
