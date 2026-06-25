'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

// Masks a secret until the user explicitly reveals it. Client-only; the value
// is already on the page (owner-only view) — this just avoids shoulder-surfing.
export function RevealSecret({ value }: { value: string }) {
  const [shown, setShown] = useState(false)
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="overline">Secret</span>
      <code className="min-w-0 flex-1 truncate font-mono text-xs">{shown ? value : '••••••••••'}</code>
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? 'Hide secret' : 'Reveal secret'}
        className="flex size-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}
