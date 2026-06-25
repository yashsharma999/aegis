'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ThreadSidebar } from './thread-sidebar'
import { AssistantChat } from './assistant-chat'
import { resetNewChat } from './chat-store'

export function AssistantWorkspace({
  userId,
  routeThreadId,
}: {
  userId: string
  routeThreadId: string | null
}) {
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[520px] flex-row overflow-hidden">
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
          onActivity={() => setRefreshKey((k) => k + 1)}
        />
      </div>
    </div>
  )
}
