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
import { createLegacyLink, revokeLegacyLink } from '@/lib/actions'

// Generates a real, revocable Legacy-Mode access link for a beneficiary. The
// link only opens the vault once it has entered Legacy Mode (the trigger).
export function LegacyAccessButton({ beneficiaryId, name }: { beneficiaryId: string; name: string }) {
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [copied, setCopied] = useState(false)

  const link = token ? `${typeof window !== 'undefined' ? window.location.origin : ''}/legacy/${token}` : null

  async function generate() {
    setPending(true)
    const res = await createLegacyLink(beneficiaryId)
    setPending(false)
    if (res.ok) {
      setToken(res.token)
      setCopied(false)
    } else {
      toast.error('Could not create a link.')
    }
  }

  async function copy() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success('Access link copied')
    } catch {
      toast.error('Could not copy — select the link manually')
    }
  }

  async function revoke() {
    if (!token) return
    setPending(true)
    const res = await revokeLegacyLink(token)
    setPending(false)
    if (res.ok) {
      setToken(null)
      toast.success('Link revoked')
    } else {
      toast.error('Could not revoke')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) {
          setToken(null)
          setCopied(false)
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Share2 className="size-4" data-icon="inline-start" />
        Share access
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Legacy access for {name}</DialogTitle>
          <DialogDescription>
            A private link that lets {name} talk to Aegis about your vault — but only once it has entered Legacy Mode.
            Until then the link stays dormant. Revoke any time.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {link ? (
            <>
              <div className="flex items-center gap-2 rounded-xl border bg-secondary/50 p-2">
                <code className="flex-1 truncate px-2 text-sm">{link}</code>
                <Button size="icon" variant="ghost" onClick={copy} className="shrink-0">
                  {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                  <span className="sr-only">Copy link</span>
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="size-4" />
                  Dormant until Legacy Mode · revocable
                </p>
                <Button variant="ghost" size="sm" onClick={revoke} disabled={pending} className="text-destructive">
                  Revoke
                </Button>
              </div>
            </>
          ) : (
            <Button onClick={generate} disabled={pending}>
              {pending ? 'Creating…' : 'Create access link'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
