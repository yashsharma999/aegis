"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShieldCheck, Eye, EyeOff, ArrowRight, FileText, Users, Bell, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field"
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group"
import { signIn } from "@/lib/auth"

const SETUP_STEPS = [
  { icon: FileText, label: "File your documents & policies" },
  { icon: Users, label: "Name the people who matter" },
  { icon: Bell, label: "Set renewal reminders" },
  { icon: KeyRound, label: "Decide who sees what, and when" },
]

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const next: { name?: string; email?: string; password?: string; confirm?: string } = {}
    if (!name.trim()) {
      next.name = "Tell us what to call you."
    }
    if (!email.trim()) {
      next.email = "Enter your email address."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "That doesn't look like a valid email."
    }
    if (!password) {
      next.password = "Choose a password."
    } else if (password.length < 6) {
      next.password = "Password must be at least 6 characters."
    }
    if (confirm !== password) {
      next.confirm = "Passwords don't match."
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    // UI-only: no real account is created. Signing in opens the demo vault.
    await signIn(email.trim())
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      {/* Brand panel */}
      <section className="relative hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary-foreground/10 ring-1 ring-inset ring-primary-foreground/15">
            <ShieldCheck className="size-5" />
          </span>
          <span className="flex flex-col gap-1 leading-none">
            <span className="font-serif text-xl font-semibold tracking-tight">Aegis</span>
            <span className="text-[0.625rem] font-medium uppercase tracking-[0.18em] text-primary-foreground/55">
              Chief of staff for life
            </span>
          </span>
        </div>

        <div className="flex flex-col gap-8">
          <h1 className="max-w-md font-serif text-[2.75rem] font-semibold leading-[1.08] tracking-[-0.02em] text-balance">
            Start the vault you&apos;ll be glad you kept —{" "}
            <span className="italic font-normal text-accent">long before anyone needs it.</span>
          </h1>
          <p className="max-w-sm text-pretty leading-relaxed text-primary-foreground/70">
            A few quiet minutes today saves the people you love from scrambling later. Here&apos;s
            what setting up looks like.
          </p>
          <div className="flex flex-col">
            <span className="mb-3 text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-primary-foreground/45">
              Four steps to a calm vault
            </span>
            {SETUP_STEPS.map((s, i) => (
              <div
                key={s.label}
                className="flex items-center gap-3 border-t border-primary-foreground/10 py-3 last:border-b"
              >
                <span className="font-mono text-xs tabular-nums text-primary-foreground/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <s.icon className="size-4 text-accent" strokeWidth={1.75} />
                <span className="text-sm text-primary-foreground/85">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs uppercase tracking-[0.15em] text-primary-foreground/40">
          A demo experience · No real data is stored
        </p>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col gap-2.5">
            <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground ring-1 ring-inset ring-primary/40 lg:hidden">
              <ShieldCheck className="size-5" />
            </span>
            <h2 className="font-serif text-4xl font-semibold tracking-[-0.02em] text-foreground">
              Create your vault
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              It takes a minute, and everything stays in one calm place.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <FieldGroup>
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="name">Full name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Ravi Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={!!errors.name}
                />
                <FieldError>{errors.name}</FieldError>
              </Field>

              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!errors.email}
                />
                <FieldError>{errors.email}</FieldError>
              </Field>

              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!errors.password}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-xs"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((s) => !s)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <FieldError>{errors.password}</FieldError>
              </Field>

              <Field data-invalid={!!errors.confirm}>
                <FieldLabel htmlFor="confirm">Confirm password</FieldLabel>
                <Input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  aria-invalid={!!errors.confirm}
                />
                <FieldError>{errors.confirm}</FieldError>
              </Field>

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Setting up your vault..." : "Create vault"}
                {!submitting && <ArrowRight data-icon="inline-end" />}
              </Button>

              <FieldDescription className="text-center">
                Already have a vault?{" "}
                <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
                  Sign in
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
        </div>
      </section>
    </main>
  )
}
