"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { CATEGORY_LABELS, type DocumentCategory } from "@/lib/types"
import { addDocument } from "@/lib/actions"

export function AddDocumentDialog() {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function action(formData: FormData) {
    setPending(true)
    await addDocument(formData)
    setPending(false)
    setOpen(false)
    toast.success("Document queued", {
      description: "In production this is encrypted, embedded, and indexed for the agent.",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button data-icon="inline-start" />}>
        <Plus data-icon="inline-start" />
        Add document
      </DialogTrigger>
      <DialogContent>
        <form action={action}>
          <DialogHeader>
            <DialogTitle>Add a document</DialogTitle>
            <DialogDescription>
              Store a record in the vault. Your agent uses it to answer questions across every mode.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="doc-title">Title</FieldLabel>
              <Input id="doc-title" name="title" placeholder="e.g. Term Life Policy" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="doc-category">Category</FieldLabel>
              <Select name="category" defaultValue="insurance">
                <SelectTrigger id="doc-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {(Object.keys(CATEGORY_LABELS) as DocumentCategory[]).map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="doc-notes">Notes</FieldLabel>
              <Textarea
                id="doc-notes"
                name="notes"
                placeholder="What should the agent know about this document?"
                rows={3}
              />
            </Field>
            <Field orientation="horizontal">
              <Switch id="doc-sensitive" name="sensitive" />
              <div className="flex flex-col gap-1">
                <FieldLabel htmlFor="doc-sensitive">Sensitive</FieldLabel>
                <FieldDescription>Released only in Legacy mode to verified beneficiaries.</FieldDescription>
              </div>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save to vault"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
