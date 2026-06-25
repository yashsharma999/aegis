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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import type { Beneficiary } from '@/lib/types'
import { saveBeneficiary } from '@/lib/actions'

export function BeneficiaryDialog({ beneficiary }: { beneficiary?: Beneficiary }) {
  const editing = !!beneficiary
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function action(formData: FormData) {
    setPending(true)
    const result = await saveBeneficiary(formData)
    setPending(false)
    if (result.ok) {
      setOpen(false)
      toast.success(editing ? 'Beneficiary updated' : 'Beneficiary added')
    } else {
      toast.error(result.error === 'name_required' ? 'A name is required.' : "Couldn't save.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          editing ? (
            <Button variant="ghost" size="icon" aria-label={`Edit ${beneficiary!.name}`} className="size-8 text-muted-foreground" />
          ) : (
            <Button data-icon="inline-start" />
          )
        }
      >
        {editing ? <Pencil className="size-4" /> : <><Plus data-icon="inline-start" />Add beneficiary</>}
      </DialogTrigger>
      <DialogContent>
        <form action={action}>
          {editing ? <input type="hidden" name="id" value={beneficiary!.id} /> : null}
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit beneficiary' : 'Add a beneficiary'}</DialogTitle>
            <DialogDescription>
              Someone you can grant Legacy-Mode access to. After adding them, use “Share access” to create their private link.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="ben-name">Name</FieldLabel>
              <Input id="ben-name" name="name" defaultValue={beneficiary?.name ?? ''} placeholder="Priya Sharma" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="ben-rel">Relationship</FieldLabel>
              <Input id="ben-rel" name="relationship" defaultValue={beneficiary?.relationship ?? ''} placeholder="Wife" />
            </Field>
            <Field>
              <FieldLabel htmlFor="ben-wa">WhatsApp / phone</FieldLabel>
              <Input id="ben-wa" name="whatsapp" type="tel" defaultValue={beneficiary?.whatsapp ?? ''} placeholder="+91 98860 12345" />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : editing ? 'Save changes' : 'Add beneficiary'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
