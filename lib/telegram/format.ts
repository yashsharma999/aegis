// Convert the agent's GitHub-flavored markdown into Telegram-friendly HTML
// (parse_mode: 'HTML') and split it into <=4096-char, tag-balanced chunks.
//
// Telegram has no markdown headings / tables / horizontal rules, so we map
// headings → bold, tables/code → <pre>, and drop rules. HTML mode only needs
// &, <, > escaped — far safer than MarkdownV2's escape-everything rules.

const LIMIT = 3800 // headroom under Telegram's hard 4096-char message cap

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Inline markdown → HTML. Input must already be &,<,> escaped.
function inline(s: string): string {
  return s
    .replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`)
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/__([^_]+)__/g, '<b>$1</b>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
}

// Break markdown into self-contained (tag-balanced) HTML blocks.
function toBlocks(md: string): string[] {
  const lines = md.replace(/\r/g, '').split('\n')
  const blocks: string[] = []
  let fence: string[] | null = null
  let table: string[] = []

  const flushTable = () => {
    if (!table.length) return
    const rows = table
      .filter((r) => !/^\s*\|?[\s:|-]+\|?\s*$/.test(r)) // drop |---|---| separator rows
      .map((r) => r.replace(/\*\*/g, '').trim())
    if (rows.length) blocks.push(`<pre>${esc(rows.join('\n'))}</pre>`)
    table = []
  }

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (fence) {
        blocks.push(`<pre>${esc(fence.join('\n'))}</pre>`)
        fence = null
      } else {
        flushTable()
        fence = []
      }
      continue
    }
    if (fence) {
      fence.push(line)
      continue
    }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      table.push(line)
      continue
    }
    flushTable()
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) continue // horizontal rule → drop
    const heading = line.match(/^#{1,6}\s+(.*)$/)
    if (heading) {
      blocks.push(`<b>${inline(esc(heading[1]))}</b>`)
      continue
    }
    const bullet = line.match(/^(\s*)[-*+]\s+(.*)$/)
    if (bullet) {
      blocks.push(`${bullet[1]}• ${inline(esc(bullet[2]))}`)
      continue
    }
    blocks.push(inline(esc(line)))
  }
  if (fence) blocks.push(`<pre>${esc(fence.join('\n'))}</pre>`)
  flushTable()
  return blocks
}

// Ready-to-send HTML chunks (each tag-balanced and within Telegram's limit).
export function formatForTelegram(md: string): string[] {
  const chunks: string[] = []
  let cur = ''
  for (const block of toBlocks(md)) {
    if (block.length > LIMIT) {
      if (cur) {
        chunks.push(cur)
        cur = ''
      }
      for (let i = 0; i < block.length; i += LIMIT) chunks.push(block.slice(i, i + LIMIT))
      continue
    }
    if (cur && cur.length + 1 + block.length > LIMIT) {
      chunks.push(cur)
      cur = ''
    }
    cur = cur ? `${cur}\n${block}` : block
  }
  if (cur) chunks.push(cur)
  return chunks.filter((c) => c.length > 0)
}

// Last-resort plain text if Telegram rejects our HTML entities.
export function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}
