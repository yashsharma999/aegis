import { memory } from '@/lib/mastra/storage'
import { identityFromHeaders } from '@/lib/mastra/identity'

// Past messages for a thread (UI hydrate on reload). Returns the same shape the
// browser's mapDbMessage already parses. Failures degrade to empty (start fresh).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const id = await identityFromHeaders(req.headers)
  if (!id.ok) return Response.json({ messages: [] })

  const { threadId, resource } = (await req.json()) as { threadId: string; resource: string }
  try {
    const { messages } = await memory.recall({ threadId, resourceId: resource })
    return Response.json({ messages })
  } catch {
    return Response.json({ messages: [] })
  }
}
