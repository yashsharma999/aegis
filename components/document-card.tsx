import { FileText, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CATEGORY_LABELS, type Document } from '@/lib/types'

export function DocumentCard({ doc }: { doc: Document }) {
  return (
    <Card className="group rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)]">
      <CardContent className="flex flex-col gap-4 py-1">
        <div className="flex items-start justify-between gap-2">
          <span className="flex size-10 items-center justify-center rounded-full border border-border text-foreground/70 transition-colors group-hover:border-foreground/30">
            <FileText className="size-5" strokeWidth={1.75} />
          </span>
          {doc.sensitive ? (
            <Badge variant="outline" className="gap-1 rounded-full border-accent/50 bg-accent/20 text-accent-foreground">
              <Lock className="size-3" />
              Sensitive
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="overline">{CATEGORY_LABELS[doc.category]}</span>
          <h3 className="font-serif text-lg font-semibold leading-snug tracking-tight text-balance">
            {doc.title}
          </h3>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{doc.notes}</p>
        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="truncate font-mono">{doc.fileName}</span>
          <span className="shrink-0 tabular-nums">
            {new Date(doc.uploadedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
