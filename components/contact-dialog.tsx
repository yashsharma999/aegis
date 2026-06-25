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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import type { Contact } from '@/lib/types'
import { saveContact } from '@/lib/actions'

export function ContactDialog({ contact }: { contact?: Contact }) {
  const editing = !!contact
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function action(formData: FormData) {
    setPending(true)
    const result = await saveContact(formData)
    setPending(false)
    if (result.ok) {
      setOpen(false)
      toast.success(editing ? 'Contact updated' : 'Contact added')
    } else {
      toast.error(result.error === 'name_required' ? 'A name is required.' : "Couldn't save the contact.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          editing ? (
            <Button variant="ghost" size="icon" aria-label={`Edit ${contact!.name}`} className="size-8 text-muted-foreground" />
          ) : (
            <Button data-icon="inline-start" />
          )
        }
      >
        {editing ? <Pencil className="size-4" /> : <><Plus data-icon="inline-start" />Add contact</>}
      </DialogTrigger>
      <DialogContent>
        <form action={action}>
          {editing ? <input type="hidden" name="id" value={contact!.id} /> : null}
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit contact' : 'Add a contact'}</DialogTitle>
            <DialogDescription>The people your family should call first, with why each one matters.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="con-name">Name</FieldLabel>
              <Input id="con-name" name="name" defaultValue={contact?.name ?? ''} placeholder="Dr. Meera Nair" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="con-role">Role</FieldLabel>
              <Input id="con-role" name="role" defaultValue={contact?.role ?? ''} placeholder="Family doctor" />
            </Field>
            <Field>
              <FieldLabel htmlFor="con-phone">Phone</FieldLabel>
              <Input id="con-phone" name="phone" type="tel" defaultValue={contact?.phone ?? ''} placeholder="+91 98450 33210" />
            </Field>
            <Field>
              <FieldLabel htmlFor="con-notes">Notes</FieldLabel>
              <Textarea id="con-notes" name="notes" defaultValue={contact?.notes ?? ''} rows={3} placeholder="Why this person matters / when to call them." />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : editing ? 'Save changes' : 'Add contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
