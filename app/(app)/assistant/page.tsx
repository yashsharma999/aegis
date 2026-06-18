import { PageHeader } from '@/components/page-header'
import { AgentChat, type ChatBubble } from '@/components/agent-chat'
import { Card } from '@/components/ui/card'

const initialMessages: ChatBubble[] = [
  {
    id: 'a-1',
    from: 'agent',
    text: "Hi Ravi — I'm your chief of staff. I know everything in your vault: your policies, documents, renewals, medical details and wishes. Ask me anything, and I'll point you straight to the answer and the document it came from.",
  },
]

const suggestions = [
  "What's my car insurance policy number?",
  'When does my passport expire?',
  'Is Manipal in my health network?',
  'Help me file a health claim',
]

export default function AssistantPage() {
  return (
    <>
      <PageHeader
        title="Ask the agent"
        description="Your everyday assistant for life admin. It pulls real answers from your vault and always shows its source."
      />
      <Card className="flex h-[calc(100vh-15rem)] min-h-[520px] flex-col overflow-hidden rounded-3xl p-0">
        <AgentChat mode="everyday" initialMessages={initialMessages} suggestions={suggestions} />
      </Card>
    </>
  )
}
