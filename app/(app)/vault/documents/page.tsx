import { db } from "@/lib/db"
import { CATEGORY_LABELS, type DocumentCategory } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { DocumentCard } from "@/components/document-card"
import { AddDocumentDialog } from "@/components/add-document-dialog"
import { Badge } from "@/components/ui/badge"

export const metadata = { title: "Documents · Aegis" }

export default async function DocumentsPage() {
  const documents = await db.getDocuments()

  const byCategory = documents.reduce<Record<string, typeof documents>>((acc, doc) => {
    acc[doc.category] = acc[doc.category] ? [...acc[doc.category], doc] : [doc]
    return acc
  }, {})

  const categories = Object.keys(byCategory) as DocumentCategory[]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Document vault"
        description="Every record your family would need, encrypted and understood by your agent."
        action={<AddDocumentDialog />}
      />

      <div className="flex flex-col gap-8">
        {categories.map((category) => (
          <section key={category} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg text-foreground">{CATEGORY_LABELS[category]}</h2>
              <Badge variant="secondary">{byCategory[category].length}</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {byCategory[category].map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
