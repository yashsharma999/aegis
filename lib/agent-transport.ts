// Browser → in-process agent routes (app/api/agent/*). Replaces the
// @mastra/client-js calls to the standalone Mastra server: everything now runs
// on the same Vercel origin, so these are plain same-origin fetches. Identity
// still rides as x-aegis-* headers, read by lib/mastra/identity.ts.

export type AgentAuth = { userId?: string; grantToken?: string; mode?: string }

export type StreamChunk = { type: string; payload?: any }

function authHeaders(auth: AgentAuth): Record<string, string> {
  const h: Record<string, string> = { 'content-type': 'application/json' }
  // Beneficiary presents a grant token (no owner id); owner presents their id.
  if (auth.grantToken) h['x-aegis-grant-token'] = auth.grantToken
  else if (auth.userId) h['x-aegis-user-id'] = auth.userId
  if (auth.mode) h['x-aegis-mode'] = auth.mode
  return h
}

// Stream a turn. Reads the NDJSON body and hands each chunk to onChunk in the
// same { type, payload } shape the agent emits natively.
export async function streamAgent(
  auth: AgentAuth,
  body: { messages: { role: string; content: string }[]; memory: { thread: string; resource: string } },
  onChunk: (chunk: StreamChunk) => void,
): Promise<void> {
  const res = await fetch('/api/agent/stream', {
    method: 'POST',
    headers: authHeaders(auth),
    body: JSON.stringify(body),
  })
  if (!res.ok || !res.body) throw new Error(`agent stream failed (${res.status})`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    let nl: number
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim()
      buf = buf.slice(nl + 1)
      if (line) onChunk(JSON.parse(line) as StreamChunk)
    }
  }
  const tail = buf.trim()
  if (tail) onChunk(JSON.parse(tail) as StreamChunk)
}

// Past messages for a thread (DB shape; caller maps them).
export async function fetchHistory(
  auth: AgentAuth,
  threadId: string,
  resource: string,
): Promise<Record<string, any>[]> {
  const res = await fetch('/api/agent/history', {
    method: 'POST',
    headers: authHeaders(auth),
    body: JSON.stringify({ threadId, resource }),
  })
  if (!res.ok) return []
  return (await res.json())?.messages ?? []
}

export type ThreadRow = { id: string; title?: string; updatedAt?: string }

export async function listThreads(auth: AgentAuth): Promise<ThreadRow[]> {
  const res = await fetch('/api/agent/threads', {
    method: 'POST',
    headers: authHeaders(auth),
    body: '{}',
  })
  if (!res.ok) return []
  return (((await res.json())?.threads ?? []) as ThreadRow[]).filter((t) => t.id)
}

export async function deleteThread(auth: AgentAuth, threadId: string): Promise<void> {
  await fetch('/api/agent/threads', {
    method: 'DELETE',
    headers: authHeaders(auth),
    body: JSON.stringify({ threadId }),
  })
}
