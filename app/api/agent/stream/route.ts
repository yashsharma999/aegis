import { vaultAgent } from '@/lib/mastra/agent'
import { identityFromHeaders } from '@/lib/mastra/identity'

// Streaming chat, in-process on Vercel (replaces the standalone Mastra server).
// We forward the agent's native fullStream chunks ({ type, payload }) as NDJSON;
// the browser parses each line straight into the existing chunk handler, so the
// stream wire-format the UI already understands is preserved exactly.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Vercel Hobby ceiling

export async function POST(req: Request) {
  const id = await identityFromHeaders(req.headers)
  if (!id.ok) return Response.json({ error: id.error }, { status: id.status })

  const { messages, memory } = (await req.json()) as {
    messages: { role: 'user'; content: string }[]
    memory: { thread: string; resource: string }
  }

  const result = await vaultAgent.stream(messages, {
    requestContext: id.requestContext,
    memory,
    maxSteps: 10,
  })

  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of result.fullStream) {
          controller.enqueue(encoder.encode(JSON.stringify(chunk) + '\n'))
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ type: 'error', payload: { message: String(err) } }) + '\n',
          ),
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(body, {
    headers: { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-cache' },
  })
}
