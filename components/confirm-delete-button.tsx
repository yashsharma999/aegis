'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { deleteNote, deleteContact, deleteCredential, deleteBeneficiary } from '@/lib/actions'

type Kind = 'note' | 'contact' | 'credential' | 'beneficiary'

const DELETERS: Record<Kind, (id: string) => Promise<{ ok: boolean }>> = {
  note: deleteNote,
  contact: deleteContact,
  credential: deleteCredential,
  beneficiary: deleteBeneficiary,
}

// Generic confirm-and-delete for the structured/authored vault items.
export function ConfirmDeleteButton({ kind, id, label }: { kind: Kind; id: string; label: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function onConfirm() {
    startTransition(async () => {
      const res = await DELETERS[kind](id)
      if (res.ok) {
        toast.success('Deleted')
        setOpen(false)
      } else {
        toast.error("Couldn't delete that.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${label}`}
            className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          />
        }
      >
        <Trash2 className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete “{label}”?</DialogTitle>
          <DialogDescription>This permanently removes it from your vault. This can’t be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
