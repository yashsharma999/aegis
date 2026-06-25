import { ScrollText, Sparkles } from "lucide-react"
import { db } from "@/lib/db"
import { categoryLabel } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { Markdown } from "@/components/markdown"
import { NoteDialog } from "@/components/note-dialog"
import { ConfirmDeleteButton } from "@/components/confirm-delete-button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"

export const metadata = { title: "Wishes & instructions · Aegis" }

export default async function InstructionsPage() {
  const notes = await db.getNotes()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Wishes & instructions"
        description="Your words, written freely and made searchable — ready to guide your family through the first hours and the hardest decisions."
        action={<NoteDialog />}
      />
      {notes.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ScrollText />
            </EmptyMedia>
            <EmptyTitle>No notes written yet</EmptyTitle>
            <EmptyDescription>
              Leave guidance for the first 24 hours, your wishes, financial notes and personal messages. These are the
              words your family — and your agent — will lean on most.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <NoteDialog />
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {notes.map((note) => (
            <Card key={note.id} className="rounded-xl transition-colors hover:border-foreground/20">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full border border-accent/50 bg-accent/15 text-accent-foreground">
                      <Sparkles className="size-5" strokeWidth={1.75} />
                    </span>
                    <div className="flex flex-col gap-1">
                      <CardTitle className="font-serif text-xl tracking-tight">{note.title}</CardTitle>
                      <Badge variant="secondary" className="w-fit rounded-full">{categoryLabel(note.category)}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <NoteDialog note={note} />
                    <ConfirmDeleteButton kind="note" id={note.id} label={note.title} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm leading-relaxed text-muted-foreground">
                  <Markdown>{note.body ?? ""}</Markdown>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
