'use client'

import { useState } from 'react'
import {
  Search,
  BellRing,
  Link2,
  FileText,
  Wrench,
  Check,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Friendly label + icon per agent tool. Keep in sync with lib/mastra/tools.ts.
const TOOLS: Record<string, { label: string; icon: LucideIcon }> = {
  searchVault: { label: 'Searching your vault', icon: Search },
  readDocument: { label: 'Reading the document', icon: FileText },
  getDocumentLink: { label: 'Fetching the document link', icon: Link2 },
  getReminders: { label: 'Checking renewals', icon: BellRing },
}

// Compact summary of scalar arg values, e.g. searchVault · "claim form".
function summarizeArgs(args: unknown): string {
  if (!args || typeof args !== 'object') return ''
  const vals = Object.values(args as Record<string, unknown>)
    .filter((v) => v != null && typeof v !== 'object')
    .map((v) => (typeof v === 'string' ? `"${v}"` : String(v)))
  return vals.length ? ` · ${vals.join(' · ')}` : ''
}

export function ToolCall({
  name,
  args,
  result,
  done,
}: {
  name: string
  args?: unknown
  result?: unknown
  done: boolean
}) {
  const [open, setOpen] = useState(false)
  const meta = TOOLS[name] ?? { label: name, icon: Wrench }
  const Icon = meta.icon
  const hasDetail = args !== undefined || result !== undefined

  return (
    <div className="my-1.5">
      <button
        type="button"
        onClick={() => hasDetail && setOpen((o) => !o)}
        className={cn(
          'inline-flex max-w-full items-center gap-2 rounded-full border bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground transition-colors',
          hasDetail && 'cursor-pointer hover:border-primary/40',
        )}
      >
        <Icon className="size-3.5 shrink-0 text-accent" strokeWidth={2} />
        <span className="truncate font-medium text-foreground/80">
          {meta.label}
          <span className="font-normal text-muted-foreground">{summarizeArgs(args)}</span>
        </span>
        {done ? (
          <Check className="size-3.5 shrink-0 text-success" strokeWidth={2.5} />
        ) : (
          <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-accent" />
        )}
      </button>
      {open && hasDetail ? (
        <pre className="mt-1.5 max-w-full overflow-x-auto rounded-lg border bg-secondary/30 px-3 py-2 font-mono text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {JSON.stringify({ args, result }, null, 2)}
        </pre>
      ) : null}
    </div>
  )
}
