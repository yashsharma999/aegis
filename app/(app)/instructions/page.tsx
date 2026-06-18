import { Sunrise, Flower2, MessageSquareHeart, Landmark, ScrollText } from "lucide-react"
import { db } from "@/lib/db"
import type { InstructionType } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"

export const metadata = { title: "Instructions · Aegis" }

const ICONS: Record<InstructionType, typeof Sunrise> = {
  first24: Sunrise,
  funeral: Flower2,
  messages: MessageSquareHeart,
  financial: Landmark,
}

export default async function InstructionsPage() {
  const instructions = await db.getInstructions()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Vault · Legacy"
        title="Instructions & wishes"
        description="Your words, ready to guide your family through the first hours and the hardest decisions."
      />
      {instructions.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ScrollText />
            </EmptyMedia>
            <EmptyTitle>No instructions written yet</EmptyTitle>
            <EmptyDescription>
              Leave guidance for the first 24 hours, your wishes, financial notes and personal messages. These are the
              words your family will lean on most.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {instructions.map((ins) => {
            const Icon = ICONS[ins.type]
            return (
            <Card key={ins.id} className="rounded-xl transition-colors hover:border-foreground/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full border border-accent/50 bg-accent/15 text-accent-foreground">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <CardTitle className="font-serif text-xl tracking-tight">{ins.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-muted-foreground whitespace-pre-line">{ins.body}</p>
              </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
