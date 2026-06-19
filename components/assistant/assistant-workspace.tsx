'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { ThreadSidebar } from './thread-sidebar'
import { AssistantChat } from './assistant-chat'
import { resetNewChat } from './chat-store'

export function AssistantWorkspace({
  userId,
  suggestions,
  routeThreadId,
}: {
  userId: string
  suggestions: string[]
  routeThreadId: string | null
}) {
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <Card className="flex h-[calc(100vh-9rem)] min-h-[520px] flex-row overflow-hidden rounded-xl p-0">
      <ThreadSidebar
        userId={userId}
        refreshKey={refreshKey}
        onSelect={(id) => router.push(`/assistant/${id}`)}
        onNew={() => {
          resetNewChat()
          router.push('/assistant')
        }}
      />
      <div className="min-w-0 flex-1">
        {/* key resets local input state when navigating to a specific thread.
            The active thread id itself is derived from the URL inside the store. */}
        <AssistantChat
          key={routeThreadId ?? 'new'}
          userId={userId}
          suggestions={suggestions}
          onActivity={() => setRefreshKey((k) => k + 1)}
        />
      </div>
    </Card>
  )
}
