import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { AgentChat, type ChatBubble } from '@/components/agent-chat'
import { owner } from '@/lib/mock-data'

const familyName = 'Priya'

const initialMessages: ChatBubble[] = [
  {
    id: 'f-1',
    from: 'agent',
    text: `Hi ${familyName}. I'm Aegis — ${owner.name.split(' ')[0]}'s assistant. I haven't been able to reach ${owner.name.split(' ')[0]} and I'm checking in to make sure everything is okay. If you're in touch with them, please ask them to check in directly. If you need access to anything urgent right now, I'm here to help.`,
  },
  {
    id: 'f-2',
    from: 'agent',
    text: `Before I share anything sensitive, I just need to confirm it's you. ${owner.name.split(' ')[0]} left a private question for verification: what is the city of your anniversary?`,
  },
  {
    id: 'f-3',
    from: 'family',
    text: 'Udaipur',
  },
  {
    id: 'f-4',
    from: 'agent',
    text: `Thank you, ${familyName} — verified. I'm here whenever you need me. I can walk you through any documents, insurance policies, or information ${owner.name.split(' ')[0]} wanted you to have access to. Just ask.`,
  },
]

const suggestions = [
  'What documents are available?',
  'How do I access the insurance?',
  'Where are the important accounts?',
  'Is there a message left for me?',
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
        This is what a verified contact sees when Aegis initiates a check-in — a calm, guided
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
            <span className="text-xs text-primary-foreground/70">Checking in on your behalf</span>
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
