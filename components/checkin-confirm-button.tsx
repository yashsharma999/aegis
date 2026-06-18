"use client"

import { useState, useTransition } from "react"
import { Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { confirmCheckin } from "@/lib/actions"

export function CheckinConfirmButton() {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  function onClick() {
    startTransition(async () => {
      await confirmCheckin()
      setDone(true)
      toast.success("Check-in confirmed", {
        description: "Your timer is reset. The vault stays dormant.",
      })
    })
  }

  return (
    <Button onClick={onClick} disabled={pending || done} className="w-fit">
      <Check data-icon="inline-start" />
      {done ? "Checked in" : pending ? "Confirming..." : "I'm well — check in now"}
    </Button>
  )
}
