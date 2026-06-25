'use client'

// Beneficiary-facing chat for Legacy Mode. Same Mastra agent + streaming path
// as the owner — only the identity differs (a grant token, not a user id).

import { ChatView } from './assistant-chat'
import { useLegacyChatSession } from './chat-store'

const SUGGESTIONS = [
  'What did they want me to know first?',
  'Is there life insurance I should claim?',
  'Who should I contact?',
]

export function LegacyChat({ grantToken, ownerName }: { grantToken: string; ownerName?: string }) {
  const session = useLegacyChatSession(grantToken)
  const who = ownerName ? ` about ${ownerName}` : ''
  return (
    <ChatView
      session={session}
      suggestions={SUGGESTIONS}
      emptyHint={`I'm here to help. Ask me anything${who} — their wishes, documents, insurance, or who to call.`}
      placeholder="Ask me anything…"
    />
  )
}
