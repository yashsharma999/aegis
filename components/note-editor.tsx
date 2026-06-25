'use client'

import { useState } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { Bold, Italic, List, ListOrdered, Heading2, Quote } from 'lucide-react'
import { cn } from '@/lib/utils'

// tiptap-markdown augments editor.storage at runtime but ships no types for it.
function getMarkdown(editor: Editor): string {
  return (editor.storage as { markdown?: { getMarkdown(): string } }).markdown?.getMarkdown() ?? ''
}

// Rich text authoring whose canonical value is MARKDOWN. The editor UI is
// TipTap; on every change we serialize to markdown and mirror it into a hidden
// input so the surrounding native <form action> submits markdown as `name`.
export function NoteEditor({
  name = 'body',
  defaultValue = '',
}: {
  name?: string
  defaultValue?: string
}) {
  const [md, setMd] = useState(defaultValue)

  const editor = useEditor({
    immediatelyRender: false, // avoid SSR hydration mismatch in Next
    extensions: [StarterKit, Markdown.configure({ html: false })],
    content: defaultValue,
    editorProps: {
      attributes: {
        class:
          'min-h-[200px] max-h-[420px] overflow-y-auto px-3 py-2.5 text-sm leading-relaxed outline-none [&_h2]:font-serif [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_p]:mb-2',
      },
    },
    onUpdate: ({ editor }) => setMd(getMarkdown(editor)),
  })

  return (
    <div className="rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring/40">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={md} />
    </div>
  )
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return <div className="h-9 border-b" />
  const items = [
    { icon: Bold, label: 'Bold', run: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
    { icon: Italic, label: 'Italic', run: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
    { icon: Heading2, label: 'Heading', run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
    { icon: List, label: 'Bullet list', run: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
    { icon: ListOrdered, label: 'Numbered list', run: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
    { icon: Quote, label: 'Quote', run: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote') },
  ]
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b px-1.5 py-1">
      {items.map(({ icon: Icon, label, run, active }) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          aria-pressed={active}
          onClick={run}
          className={cn(
            'flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
            active && 'bg-accent text-accent-foreground',
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  )
}
