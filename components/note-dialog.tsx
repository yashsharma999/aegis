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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { NoteEditor } from '@/components/note-editor'
import { CATEGORY_LABELS, NOTE_CATEGORIES, type Document } from '@/lib/types'
import { saveNote } from '@/lib/actions'

// Create or edit a free-form markdown note (wishes / instructions).
export function NoteDialog({
  note,
  defaultCategory = 'wishes',
}: {
  note?: Document
  defaultCategory?: (typeof NOTE_CATEGORIES)[number]
}) {
  const editing = !!note
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function action(formData: FormData) {
    setPending(true)
    const result = await saveNote(formData)
    setPending(false)
    if (result.ok) {
      setOpen(false)
      toast.success(editing ? 'Note updated' : 'Note saved')
    } else {
      toast.error(result.error === 'empty' ? 'Add a title or some text.' : "Couldn't save the note.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          editing ? (
            <Button variant="ghost" size="icon" aria-label={`Edit ${note!.title}`} className="size-8 text-muted-foreground" />
          ) : (
            <Button data-icon="inline-start" />
          )
        }
      >
        {editing ? <Pencil className="size-4" /> : <><Plus data-icon="inline-start" />New note</>}
      </DialogTrigger>
      <DialogContent>
        <form action={action}>
          {editing ? <input type="hidden" name="id" value={note!.id} /> : null}
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit note' : 'Write a note'}</DialogTitle>
            <DialogDescription>
              Your own words — wishes, instructions, anything. Saved as markdown and made searchable so your agent can
              draw on it.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="note-title">Title</FieldLabel>
              <Input id="note-title" name="title" defaultValue={note?.title ?? ''} placeholder="e.g. Funeral wishes" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="note-category">Category</FieldLabel>
              <Select name="category" defaultValue={note?.category ?? defaultCategory}>
                <SelectTrigger id="note-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {NOTE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Content</FieldLabel>
              <NoteEditor name="body" defaultValue={note?.body ?? ''} />
            </Field>
            <Field orientation="horizontal">
              <Switch id="note-sensitive" name="sensitive" defaultChecked={note?.sensitive ?? false} />
              <div className="flex flex-col gap-1">
                <FieldLabel htmlFor="note-sensitive">Sensitive</FieldLabel>
                <FieldDescription>Marks this note as private. Released only in Legacy mode.</FieldDescription>
              </div>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : editing ? 'Save changes' : 'Save note'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
