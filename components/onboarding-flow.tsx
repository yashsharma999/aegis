"use client"

import { useState } from "react"
import Link from "next/link"
import { FolderLock, Users, MessageCircle, ShieldCheck, ArrowRight, ArrowLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const STEPS = [
  {
    icon: FolderLock,
    title: "Build your vault",
    body: "Add your insurance policies, medical records, legal documents, and financial accounts. Each one is encrypted and understood by your agent — not just stored.",
    points: ["Documents, policies, property, digital accounts", "Sensitive items stay sealed by default", "Your agent reads them so your family doesn't have to"],
  },
  {
    icon: Users,
    title: "Name your people",
    body: "Choose beneficiaries and guardians. Decide exactly what each person can see, and verify them over WhatsApp so only the right people ever gain access.",
    points: ["Per-person access scopes", "WhatsApp identity verification", "An executor to confirm before anything is released"],
  },
  {
    icon: MessageCircle,
    title: "Set the safety net",
    body: "Configure your check-in cadence. If you stop responding, Aegis checks in with you first, then escalates carefully — reaching out to your trusted contacts only after a confirmation step.",
    points: ["Regular WhatsApp check-ins", "Guardian access if you can't act", "Confirmed handoff before anything is released"],
  },
  {
    icon: ShieldCheck,
    title: "Rest easy",
    body: "That's it. Your agent now answers everyday questions, surfaces emergency medical info instantly, and stands ready to guide your family through the hardest moments.",
    points: ["Everyday answers in plain language", "One-tap emergency medical ID", "Step-by-step guidance for your family"],
  },
]

export function OnboardingFlow() {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Step {step + 1} of {STEPS.length}
          </span>
          <span>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} />
      </div>

      <Card className="flex-1 rounded-3xl">
        <CardContent className="flex flex-col gap-5 py-2">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-accent/30 text-accent-foreground">
            <Icon className="size-7" />
          </span>
          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-3xl text-balance text-foreground">{current.title}</h1>
            <p className="leading-relaxed text-muted-foreground text-pretty">{current.body}</p>
          </div>
          <ul className="flex flex-col gap-2.5">
            {current.points.map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
                  <Check className="size-3" />
                </span>
                <span className="text-foreground">{p}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ArrowLeft data-icon="inline-start" />
          Back
        </Button>
        {isLast ? (
          <Button size="lg" nativeButton={false} render={<Link href="/dashboard" />}>
            Enter your vault
            <ArrowRight data-icon="inline-end" />
          </Button>
        ) : (
          <Button size="lg" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
            Continue
            <ArrowRight data-icon="inline-end" />
          </Button>
        )}
      </div>
    </div>
  )
}
