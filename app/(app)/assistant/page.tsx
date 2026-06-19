import { AssistantView } from '@/components/assistant/assistant-view'

// New chat — no thread id yet. The first message mints one and flips the URL
// to /assistant/<id> (see AssistantChat).
export default function AssistantPage() {
  return <AssistantView routeThreadId={null} />
}
