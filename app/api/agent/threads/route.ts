import { memory } from '@/lib/mastra/storage'
import { identityFromHeaders } from '@/lib/mastra/identity'

// Thread list + delete for the owner's chat sidebar. Threads are always scoped
// to the requester's own resource id (from identity), never a client-supplied
// one, so nobody can list/delete another vault's conversations.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const id = await identityFromHeaders(req.headers)
  if (!id.ok) return Response.json({ threads: [] })
  try {
    const { threads } = await memory.listThreads({
      perPage: 50,
      page: 0,
      orderBy: { field: 'updatedAt', direction: 'DESC' },
      filter: { resourceId: id.userId },
    })
    return Response.json({ threads })
  } catch {
    return Response.json({ threads: [] })
  }
}

export async function DELETE(req: Request) {
  const id = await identityFromHeaders(req.headers)
  if (!id.ok) return Response.json({ ok: false }, { status: id.status })
  const { threadId } = (await req.json()) as { threadId: string }
  try {
    await memory.deleteThread(threadId)
    return Response.json({ ok: true })
  } catch {
    return Response.json({ ok: false })
  }
}
