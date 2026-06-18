import Link from "next/link"
import { ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OnboardingFlow } from "@/components/onboarding-flow"

export const metadata = { title: "How Aegis works" }

export default function OnboardingPage() {
  return (
    <main className="flex min-h-svh flex-col bg-background">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <span className="font-heading text-xl font-medium">Aegis</span>
        </Link>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/" />}>
          <ArrowLeft data-icon="inline-start" />
          Home
        </Button>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-8">
        <OnboardingFlow />
      </div>

      <footer className="mx-auto w-full max-w-2xl px-6 py-8">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Ready to look around?</span>
          <Button variant="link" size="sm" nativeButton={false} render={<Link href="/dashboard" />}>
            Skip to the vault
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </footer>
    </main>
  )
}
