import { PageHeader } from '@/components/page-header'
import { AgentChat, type ChatBubble } from '@/components/agent-chat'
import { Card } from '@/components/ui/card'
import { db } from '@/lib/db'

const suggestions = [
  "What's my car insurance policy number?",
  'When does my passport expire?',
  'Is Manipal in my health network?',
  'Help me file a health claim',
]

export default async function AssistantPage() {
  const [owner, documents] = await Promise.all([db.getOwner(), db.getDocuments()])
  const hasVault = documents.length > 0
  const firstName = owner.name ? owner.name.split(' ')[0] : null

  const initialMessages: ChatBubble[] = [
    {
      id: 'a-1',
      from: 'agent',
      text: hasVault
        ? `Hi ${firstName ?? 'there'} — I'm your chief of staff. I know everything in your vault: your policies, documents, renewals, medical details and wishes. Ask me anything, and I'll point you straight to the answer and the document it came from.`
        : "Hi — I'm your chief of staff. Your vault is empty right now, so there's nothing for me to pull from yet. Add your documents, insurance policies, medical details and wishes, and I'll be able to answer questions and always show you the source.",
    },
  ]

  return (
    <>
      <PageHeader
        title="Ask the agent"
        description="Your everyday assistant for life admin. It pulls real answers from your vault and always shows its source."
      />
      <Card className="flex h-[calc(100vh-16rem)] min-h-[520px] flex-col overflow-hidden rounded-xl p-0">
        <AgentChat
          mode="everyday"
          initialMessages={initialMessages}
          suggestions={hasVault ? suggestions : []}
        />
      </Card>
    </>
  )
}
