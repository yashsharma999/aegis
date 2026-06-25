// Shared server view for both /assistant (new chat) and /assistant/[threadId]
// (resume). Resolves the session user, then renders the client workspace.

import { AssistantWorkspace } from '@/components/assistant/assistant-workspace'
import { getSessionUser } from '@/lib/session'

export async function AssistantView({ routeThreadId }: { routeThreadId: string | null }) {
  const user = await getSessionUser()
  if (!user) return null
  return <AssistantWorkspace userId={user.id} routeThreadId={routeThreadId} />
}
