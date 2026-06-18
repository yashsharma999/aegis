import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { AgentChat, type ChatBubble } from '@/components/agent-chat'
import { owner } from '@/lib/mock-data'

const familyName = 'Priya'

const initialMessages: ChatBubble[] = [
  {
    id: 'f-1',
    from: 'agent',
    text: `Hello ${familyName}. I'm Aegis, ${owner.name}'s assistant. First — I'm so deeply sorry for your loss. Ravi set me up to look after you and Aanya for exactly this moment, so you never have to face the paperwork alone.`,
  },
  {
    id: 'f-2',
    from: 'agent',
    text: `Before I share anything sensitive, I just need to confirm it's you. Ravi left a private question: what is the city of your anniversary?`,
  },
  {
    id: 'f-3',
    from: 'family',
    text: 'Udaipur',
  },
  {
    id: 'f-4',
    from: 'agent',
    text: `Thank you, ${familyName} — verified. Take all the time you need. When you're ready, I can walk you through the first steps, help you claim the insurance, show you where the funds are, or share the messages Ravi left for you. There is no hurry on anything.`,
  },
]

const suggestions = [
  'How do I claim the insurance?',
  'Where are the funds?',
  'What were his funeral wishes?',
  'Did he leave a message for me?',
]

export default function FamilyPage() {
  return (
    <div className="flex min-h-svh flex-col items-center bg-secondary/40 px-4 py-8">
      <div className="mb-6 flex w-full max-w-md items-center justify-between">
        <Link
          href="/trigger"
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to demo controls
        </Link>
        <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
          <ShieldCheck className="size-4" />
          Legacy mode
        </span>
      </div>

      <p className="mb-4 max-w-md text-pretty text-center text-sm text-muted-foreground">
        This is what a verified family member sees once legacy mode is active — a calm, guided
        conversation, not a locked-down portal.
      </p>

      {/* Phone frame */}
      <div className="w-full max-w-md overflow-hidden rounded-[2.5rem] border-8 border-primary/90 bg-background shadow-2xl">
        <div className="flex items-center gap-3 bg-primary px-5 py-4 text-primary-foreground">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary-foreground/15">
            <ShieldCheck className="size-5" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-serif text-base font-semibold">Aegis</span>
            <span className="text-xs text-primary-foreground/70">Here for the Sharma family</span>
          </div>
        </div>
        <div className="h-[60vh] min-h-[460px]">
          <AgentChat
            mode="legacy"
            familyName={familyName}
            initialMessages={initialMessages}
            suggestions={suggestions}
            placeholder="Type a message to Aegis…"
            variant="phone"
          />
        </div>
      </div>
    </div>
  )
}
