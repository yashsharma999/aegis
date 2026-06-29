'use client'

import { useState } from 'react'
import { Copy, Check, Send } from 'lucide-react'
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
import { createTelegramPairCode } from '@/lib/actions'

const BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

// Links the owner's own Telegram account to their vault: mint a one-time code,
// then open the bot with it pre-filled (or send `/start <code>` manually).
export function ConnectTelegramButton() {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [copied, setCopied] = useState(false)

  const deepLink = code && BOT ? `https://t.me/${BOT}?start=${code}` : null

  async function generate() {
    setPending(true)
    const res = await createTelegramPairCode()
    setPending(false)
    if (res.ok) {
      setCode(res.code)
      setCopied(false)
    } else {
      toast.error('Could not create a pairing code.')
    }
  }

  async function copy() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('Pairing code copied')
    } catch {
      toast.error('Could not copy — select the code manually')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) {
          setCode(null)
          setCopied(false)
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Send className="size-4" data-icon="inline-start" />
        Connect Telegram
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Talk to Aegis on Telegram</DialogTitle>
          <DialogDescription>
            Generate a one-time code, then send it to the Aegis bot to link this account. The code expires in 15
            minutes.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {code ? (
            <>
              <div className="flex items-center gap-2 rounded-xl border bg-secondary/50 p-2">
                <code className="flex-1 truncate px-2 font-mono text-lg tracking-widest">{code}</code>
                <Button size="icon" variant="ghost" onClick={copy} className="shrink-0">
                  {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                  <span className="sr-only">Copy code</span>
                </Button>
              </div>
              {deepLink ? (
                <Button render={<a href={deepLink} target="_blank" rel="noopener noreferrer" />}>
                  <Send className="size-4" data-icon="inline-start" />
                  Open in Telegram
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Send <code className="font-mono">/start {code}</code> to the Aegis bot on Telegram.
                </p>
              )}
            </>
          ) : (
            <Button onClick={generate} disabled={pending}>
              {pending ? 'Creating…' : 'Generate pairing code'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
