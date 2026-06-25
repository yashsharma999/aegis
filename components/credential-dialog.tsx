'use client'

import { useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import type { Credential } from '@/lib/types'
import { saveCredential } from '@/lib/actions'

export function CredentialDialog({ credential }: { credential?: Credential }) {
  const editing = !!credential
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function action(formData: FormData) {
    setPending(true)
    const result = await saveCredential(formData)
    setPending(false)
    if (result.ok) {
      setOpen(false)
      toast.success(editing ? 'Credential updated' : 'Credential saved')
    } else {
      toast.error(result.error === 'label_required' ? 'A label is required.' : "Couldn't save the credential.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          editing ? (
            <Button variant="ghost" size="icon" aria-label={`Edit ${credential!.label}`} className="size-8 text-muted-foreground" />
          ) : (
            <Button data-icon="inline-start" />
          )
        }
      >
        {editing ? <Pencil className="size-4" /> : <><Plus data-icon="inline-start" />Add credential</>}
      </DialogTrigger>
      <DialogContent>
        <form action={action}>
          {editing ? <input type="hidden" name="id" value={credential!.id} /> : null}
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit credential' : 'Add a credential'}</DialogTitle>
            <DialogDescription>
              Logins and account secrets. These stay private — the agent can never read or surface them.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="cred-label">Label</FieldLabel>
              <Input id="cred-label" name="label" defaultValue={credential?.label ?? ''} placeholder="HDFC NetBanking" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="cred-username">Username</FieldLabel>
              <Input id="cred-username" name="username" defaultValue={credential?.username ?? ''} autoComplete="off" />
            </Field>
            <Field>
              <FieldLabel htmlFor="cred-secret">Password / secret</FieldLabel>
              <Input id="cred-secret" name="secret" defaultValue={credential?.secret ?? ''} autoComplete="off" />
              <FieldDescription>Stored in your private vault, shielded from the agent.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="cred-url">URL</FieldLabel>
              <Input id="cred-url" name="url" type="url" defaultValue={credential?.url ?? ''} placeholder="https://…" />
            </Field>
            <Field>
              <FieldLabel htmlFor="cred-notes">Notes</FieldLabel>
              <Textarea id="cred-notes" name="notes" defaultValue={credential?.notes ?? ''} rows={2} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : editing ? 'Save changes' : 'Save credential'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
