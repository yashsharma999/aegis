import { FileText, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CATEGORY_LABELS, type Document } from '@/lib/types'

export function DocumentCard({ doc }: { doc: Document }) {
  return (
    <Card className="rounded-2xl transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-3 py-1">
        <div className="flex items-start justify-between gap-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <FileText className="size-5" />
          </span>
          {doc.sensitive ? (
            <Badge variant="outline" className="gap-1 rounded-full border-accent/50 bg-accent/20 text-accent-foreground">
              <Lock className="size-3" />
              Sensitive
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-medium leading-snug text-balance">{doc.title}</h3>
          <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[doc.category]}</span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{doc.notes}</p>
        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span className="truncate font-mono">{doc.fileName}</span>
          <span className="shrink-0">
            {new Date(doc.uploadedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
