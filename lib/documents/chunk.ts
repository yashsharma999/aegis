// Paragraph-aware fixed-window chunking.
//
// Insurance/bank PDFs lack the clean structural boundaries (kap./§) legal docs
// have, so we pack paragraphs into ~800-char windows and hard-split any paragraph
// that's longer than a window, with overlap to avoid cutting facts at a boundary.

export interface Chunk {
  content: string
  index: number
}

export function chunkText(
  text: string,
  opts: { size?: number; overlap?: number } = {},
): Chunk[] {
  const size = opts.size ?? 800
  const overlap = opts.overlap ?? 120
  const step = Math.max(1, size - overlap)

  const clean = text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if (!clean) return []

  const paragraphs = clean
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  const out: string[] = []
  let buf = ''
  const flush = () => {
    const c = buf.trim()
    if (c) out.push(c)
    buf = ''
  }

  for (const para of paragraphs) {
    if (para.length > size) {
      flush()
      for (let i = 0; i < para.length; i += step) {
        const piece = para.slice(i, i + size).trim()
        if (piece) out.push(piece)
      }
      continue
    }
    if (buf && buf.length + para.length + 2 > size) flush()
    buf = buf ? `${buf}\n\n${para}` : para
  }
  flush()

  return out.map((content, index) => ({ content, index }))
}
