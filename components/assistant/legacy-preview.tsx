'use client'

// What a beneficiary would see — rendered over the OWNER's own real vault, for
// the signed-in owner to preview. Same agent + streaming path; identity is the
// owner's id with legacy mode.

import { ChatView } from './assistant-chat'
import { useOwnerLegacyPreviewSession } from './chat-store'

const SUGGESTIONS = [
  'What did they want me to know first?',
  'Is there life insurance I should claim?',
  'Who should I contact?',
]

export function LegacyPreview({ userId }: { userId: string }) {
  const session = useOwnerLegacyPreviewSession(userId)
  return (
    <ChatView
      session={session}
      suggestions={SUGGESTIONS}
      emptyHint="This is what your beneficiary sees — Aegis answering gently from your real vault."
      placeholder="Ask as your beneficiary would…"
    />
  )
}
