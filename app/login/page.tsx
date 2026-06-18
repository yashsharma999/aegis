"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, Eye, EyeOff, ArrowRight, Sun, Siren, Moon, Infinity as InfinityIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field"
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group"
import { signIn } from "@/lib/auth"
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/constants"

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    // UI-only: no password check. The email decides demo vs empty vault.
    await signIn(email.trim())
    router.push("/dashboard")
    router.refresh()
  }

  function fillDemo() {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setErrors({})
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
            Everything you&apos;d ever need to find, file, or hand over —{" "}
            <span className="italic font-normal text-accent">in one calm place.</span>
          </h1>
          <p className="max-w-sm text-pretty leading-relaxed text-primary-foreground/70">
            Your documents, policies, and wishes, safeguarded by an agent that knows exactly what to reveal, and when.
          </p>
          <div className="flex flex-col">
            <span className="mb-3 text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-primary-foreground/45">
              One vault, every season of life
            </span>
            {MODE_HINTS.map((m, i) => (
              <div
                key={m.label}
                className="flex items-center gap-3 border-t border-primary-foreground/10 py-3 last:border-b"
              >
                <span className="font-mono text-xs tabular-nums text-primary-foreground/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <m.icon className="size-4 text-accent" strokeWidth={1.75} />
                <span className="text-sm text-primary-foreground/85">{m.label}</span>
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
              Welcome back
            </h2>
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
                Sign in with any email to start a fresh, empty vault.
              </FieldDescription>
            </FieldGroup>
          </form>

          <div className="mt-6 rounded-xl border border-dashed bg-secondary/40 p-4">
            <p className="text-sm font-medium text-foreground">Want to see it filled with sample data?</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Use the demo account:
              <br />
              <span className="font-mono text-foreground">{DEMO_EMAIL}</span>
              {" / "}
              <span className="font-mono text-foreground">{DEMO_PASSWORD}</span>
            </p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={fillDemo}>
              Use demo account
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
