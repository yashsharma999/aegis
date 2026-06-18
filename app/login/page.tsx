"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, Eye, EyeOff, ArrowRight, Sun, Siren, Moon, Infinity as InfinityIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field"
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group"

const MODE_HINTS = [
  { icon: Sun, label: "Everyday" },
  { icon: Siren, label: "Emergency" },
  { icon: Moon, label: "Incapacity" },
  { icon: InfinityIcon, label: "Legacy" },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const next: { email?: string; password?: string } = {}
    if (!email.trim()) {
      next.email = "Enter your email address."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "That doesn't look like a valid email."
    }
    if (!password) {
      next.password = "Enter your password."
    } else if (password.length < 6) {
      next.password = "Password must be at least 6 characters."
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    // UI-only: no backend yet. Briefly show pending, then enter the vault.
    setTimeout(() => router.push("/dashboard"), 500)
  }

  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      {/* Brand panel */}
      <section className="relative hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary-foreground/10">
            <ShieldCheck className="size-5" />
          </span>
          <span className="font-heading text-xl font-medium">Aegis</span>
        </div>

        <div className="flex flex-col gap-6">
          <h1 className="max-w-md font-heading text-4xl leading-[1.1] text-balance">
            Everything you&apos;d ever need to find, file, or hand over — in one calm place.
          </h1>
          <p className="max-w-sm leading-relaxed text-primary-foreground/70">
            Your documents, policies, and wishes, safeguarded by an agent that knows exactly what to reveal, and when.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {MODE_HINTS.map((m) => (
              <span
                key={m.label}
                className="flex items-center gap-1.5 rounded-full bg-primary-foreground/5 px-3 py-1.5 text-sm text-primary-foreground/80 ring-1 ring-primary-foreground/10"
              >
                <m.icon className="size-3.5" />
                {m.label}
              </span>
            ))}
          </div>
        </div>

        <p className="text-sm text-primary-foreground/50">A demo experience. No real data is stored.</p>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col gap-2">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground lg:hidden">
              <ShieldCheck className="size-5" />
            </span>
            <h2 className="font-heading text-3xl text-foreground">Welcome back</h2>
            <p className="leading-relaxed text-muted-foreground">Sign in to open your vault.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <FieldGroup>
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
                    autoComplete="current-password"
                    placeholder="Enter your password"
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

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Opening your vault..." : "Sign in"}
                {!submitting && <ArrowRight data-icon="inline-end" />}
              </Button>

              <FieldDescription className="text-center">
                Don&apos;t have an account? Use any email and password to explore the demo.
              </FieldDescription>
            </FieldGroup>
          </form>
        </div>
      </section>
    </main>
  )
}
