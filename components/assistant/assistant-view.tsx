// Shared server view for both /assistant (new chat) and /assistant/[threadId]
// (resume). Fetches the session user, then renders the client workspace.

import { AssistantWorkspace } from '@/components/assistant/assistant-workspace'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/session'

const suggestions = [
  "What's my car insurance policy number?",
  'When does my passport expire?',
  'Is Manipal in my health network?',
  'Help me file a health claim',
]

export async function AssistantView({ routeThreadId }: { routeThreadId: string | null }) {
  const [user, documents] = await Promise.all([getSessionUser(), db.getDocuments()])
  const hasVault = documents.length > 0

  if (!user) return null
  return (
    <AssistantWorkspace
      userId={user.id}
      suggestions={hasVault ? suggestions : []}
      routeThreadId={routeThreadId}
    />
  )
}
