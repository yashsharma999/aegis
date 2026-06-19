import { AssistantView } from '@/components/assistant/assistant-view'

// Resume a conversation — thread id comes from the URL.
export default async function AssistantThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>
}) {
  const { threadId } = await params
  return <AssistantView routeThreadId={threadId} />
}
