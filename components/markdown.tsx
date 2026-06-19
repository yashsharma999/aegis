'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Markdown renderer for assistant messages. Element overrides keep output
// on-brand with Aegis's tokens (no generic prose theme) and handle the agent's
// common output: bold, lists, links, headings, inline/block code, tables.
export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        a: ({ children, href }) => (
          <a href={href} target="_blank" rel="noreferrer" className="font-medium text-primary underline underline-offset-2">
            {children}
          </a>
        ),
        ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        h1: ({ children }) => <h3 className="mt-1 mb-2 font-serif text-base font-semibold">{children}</h3>,
        h2: ({ children }) => <h3 className="mt-1 mb-2 font-serif text-base font-semibold">{children}</h3>,
        h3: ({ children }) => <h3 className="mt-1 mb-2 font-serif text-sm font-semibold">{children}</h3>,
        code: ({ children }) => (
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{children}</code>
        ),
        pre: ({ children }) => (
          <pre className="mb-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs last:mb-0">{children}</pre>
        ),
        table: ({ children }) => (
          <div className="mb-2 overflow-x-auto last:mb-0">
            <table className="w-full border-collapse text-left">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="border-b border-border px-2 py-1 font-medium">{children}</th>,
        td: ({ children }) => <td className="border-b border-border/60 px-2 py-1">{children}</td>,
        hr: () => <hr className="my-3 border-border" />,
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
