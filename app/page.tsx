import Link from "next/link"
import Image from "next/image"
import {
  ShieldCheck,
  MessageCircle,
  HeartPulse,
  Users,
  Bell,
  Lock,
  ArrowRight,
  Sun,
  Siren,
  Moon,
  Infinity as InfinityIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

const MODES = [
  {
    icon: Sun,
    name: "Everyday",
    line: "Your calm command center — documents, policies, and renewals, all answerable in plain language.",
  },
  {
    icon: Siren,
    name: "Emergency",
    line: "One tap surfaces blood group, allergies, active health policy, and the right hospital.",
  },
  {
    icon: Moon,
    name: "Incapacity",
    line: "If you can't act, a trusted guardian gets temporary, scoped access — nothing more.",
  },
  {
    icon: InfinityIcon,
    name: "Legacy",
    line: "If the worst happens, your family is guided step by step through claims, funds, and your wishes.",
  },
]

const FEATURES = [
  {
    icon: MessageCircle,
    title: "Answers on WhatsApp",
    body: "Your family asks a question in the app they already use. The agent replies with the exact document.",
  },
  {
    icon: HeartPulse,
    title: "Emergency medical ID",
    body: "Critical health facts ready for first responders, even when you can't speak for yourself.",
  },
  {
    icon: Bell,
    title: "Renewal radar",
    body: "Never miss a premium or expiry. The agent watches every date and nudges you early.",
  },
  {
    icon: Users,
    title: "Scoped access",
    body: "Each beneficiary sees only what you choose, only when the right conditions are met.",
  },
  {
    icon: Lock,
    title: "Encrypted vault",
    body: "Sensitive records stay sealed until a verified person needs them in the right mode.",
  },
  {
    icon: ShieldCheck,
    title: "Verified handoff",
    body: "WhatsApp verification and a dead man's switch confirm before anything is ever released.",
  },
]

export default function LandingPage() {
  return (
    <main className="flex min-h-svh flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <span className="font-heading text-xl font-medium">Aegis</span>
        </div>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" nativeButton={false} render={<Link href="/onboarding" />}>
            How it works
          </Button>
          <Button nativeButton={false} render={<Link href="/dashboard" />}>
            Open the vault
          </Button>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-6 py-12 lg:grid-cols-2 lg:py-20">
        <div className="flex flex-col gap-6">
          <Badge variant="secondary" className="w-fit gap-1.5">
            <ShieldCheck className="size-3.5" />
            The family safety net that thinks for itself
          </Badge>
          <h1 className="font-heading text-5xl leading-[1.05] text-balance text-foreground lg:text-6xl">
            Everything your family would need, the moment they need it.
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-muted-foreground text-pretty">
            Aegis is an AI agent that safeguards your documents, policies, and wishes — and guides the people you love
            through everyday questions, emergencies, and the unthinkable.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" nativeButton={false} render={<Link href="/dashboard" />}>
              Open the vault
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/family" />}>
              See the family view
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Works over WhatsApp. No app for your family to install.</p>
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-3xl ring-1 ring-foreground/10">
            <Image
              src="/images/hero-calm.png"
              alt="A family in warm morning light, calm and protected"
              width={720}
              height={720}
              className="h-full w-full object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section className="bg-primary py-16 text-primary-foreground lg:py-24">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="flex flex-col gap-3 text-center">
            <span className="text-sm font-medium uppercase tracking-wide text-primary-foreground/60">
              One vault, four modes of life
            </span>
            <h2 className="mx-auto max-w-2xl font-heading text-4xl text-balance">
              The same records, revealed exactly as each moment demands.
            </h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {MODES.map((m) => (
              <div
                key={m.name}
                className="flex flex-col gap-3 rounded-2xl bg-primary-foreground/5 p-6 ring-1 ring-primary-foreground/10"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <m.icon className="size-5" />
                </span>
                <h3 className="font-heading text-xl">{m.name}</h3>
                <p className="text-sm leading-relaxed text-primary-foreground/70">{m.line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16 lg:py-24">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">What Aegis does</span>
          <h2 className="max-w-2xl font-heading text-4xl text-balance text-foreground">
            A quiet guardian, working in the background of your life.
          </h2>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="rounded-2xl">
              <CardContent className="flex flex-col gap-3 py-1">
                <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <f.icon className="size-5" />
                </span>
                <h3 className="text-lg font-medium">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-accent/30 px-6 py-16 text-center ring-1 ring-accent/40">
          <h2 className="max-w-xl font-heading text-4xl text-balance text-foreground">
            Set it up once. Protect them for life.
          </h2>
          <p className="max-w-md leading-relaxed text-muted-foreground">
            It takes a few minutes to build your vault. It gives your family certainty for the rest of theirs.
          </p>
          <Button size="lg" nativeButton={false} render={<Link href="/onboarding" />}>
            Start protecting your family
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <span className="text-sm text-muted-foreground">Aegis — your family&apos;s safety net</span>
          </div>
          <span className="text-sm text-muted-foreground">A demo experience. No real data is stored.</span>
        </div>
      </footer>
    </main>
  )
}
