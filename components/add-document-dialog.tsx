"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Plus, Loader2 } from "lucide-react"
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
import { CATEGORY_LABELS, FILE_CATEGORIES } from "@/lib/types"
import { addDocument } from "@/lib/actions"

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "Please sign in again.",
  no_file: "Choose a PDF or image to upload.",
  unsupported_type: "Only PDFs and images are supported right now.",
  too_large: "That file is over the 20 MB limit.",
  parse_failed: "We couldn't read that file. Try another one.",
}

// Submit button lives in its own component so useFormStatus can read the
// enclosing <form>'s pending state (it only works from a child of the form).
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 data-icon="inline-start" className="animate-spin" />}
      {pending ? "Saving..." : "Save to vault"}
    </Button>
  )
}

export function AddDocumentDialog() {
  const [open, setOpen] = useState(false)
  const [needsPassword, setNeedsPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  async function action(formData: FormData) {
    setPasswordError(null)
    const result = await addDocument(formData)

    if (result.ok) {
      setOpen(false)
      setNeedsPassword(false)
      toast.success("Document added", {
        description: `Parsed and indexed into ${result.chunkCount} searchable chunk${result.chunkCount === 1 ? "" : "s"}.`,
      })
      return
    }

    if (result.error === "needs_password" || result.error === "wrong_password") {
      setNeedsPassword(true)
      setPasswordError(
        result.error === "needs_password"
          ? "This PDF is password-protected — enter its password to continue."
          : "Incorrect password. Please try again.",
      )
      toast.error("Password required")
      return
    }

    toast.error(ERROR_MESSAGES[result.error] ?? "Something went wrong.")
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) {
          setNeedsPassword(false)
          setPasswordError(null)
        }
      }}
    >
      <DialogTrigger render={<Button data-icon="inline-start" />}>
        <Plus data-icon="inline-start" />
        Add document
      </DialogTrigger>
      <DialogContent>
        <form action={action}>
          <DialogHeader>
            <DialogTitle>Add a document</DialogTitle>
            <DialogDescription>
              Upload a PDF or image. PDFs are parsed and indexed so your agent can answer questions across every mode.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="doc-file">File</FieldLabel>
              <Input id="doc-file" name="file" type="file" accept="application/pdf,image/*" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="doc-title">Title</FieldLabel>
              <Input id="doc-title" name="title" placeholder="Defaults to the file name" />
            </Field>
            <Field>
              <FieldLabel htmlFor="doc-category">Category</FieldLabel>
              <Select name="category" defaultValue="documents">
                <SelectTrigger id="doc-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {FILE_CATEGORIES.map((c) => (
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
            <Field data-invalid={!!passwordError}>
              <FieldLabel htmlFor="doc-password">
                Password {needsPassword ? "" : "(optional)"}
              </FieldLabel>
              <Input
                id="doc-password"
                name="password"
                type="password"
                placeholder="If the PDF is password-protected"
                autoComplete="off"
              />
              <FieldDescription className={passwordError ? "text-destructive" : undefined}>
                {passwordError ?? "Used once to read the file — never stored."}
              </FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
