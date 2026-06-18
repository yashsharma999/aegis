'use client'

import { useState } from 'react'
import { Copy, Check, Share2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function ShareAccessButton() {
  const [open, setOpen] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function generate() {
    const token = crypto.randomUUID().slice(0, 8)
    setLink(`https://aegis.app/e/${token}`)
    setCopied(false)
  }

  async function copy() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success('Emergency link copied')
    } catch {
      toast.error('Could not copy — select the link manually')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) generate()
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" className="border-emergency/40 text-emergency hover:bg-emergency/10">
            <Share2 className="size-4" data-icon="inline-start" />
            Share emergency access
          </Button>
        }
      />
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Share emergency access</DialogTitle>
          <DialogDescription>
            Send this read-only link to a trusted contact. It shows only your medical ID and active
            health policy — nothing else from your vault — and expires automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-xl border bg-secondary/50 p-2">
            <code className="flex-1 truncate px-2 text-sm">{link}</code>
            <Button size="icon" variant="ghost" onClick={copy} className="shrink-0">
              {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
              <span className="sr-only">Copy link</span>
            </Button>
          </div>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-4" />
            Expires in 60 minutes · revocable any time
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
