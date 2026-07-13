import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'
import { TypingAnimation } from './typingAnimation'

interface NotionEditorProps {
  content?: string
  onChange?: (html: string) => void
  placeholder?: string
}

export function NotionEditor({
  content = '',
  onChange,
  placeholder = '开始写作，输入 / 可快速切换格式…',
}: NotionEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      TypingAnimation,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'tiptap',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (content !== current) {
      editor.commands.setContent(content || '')
    }
  }, [editor, content])

  return (
    <div className="notion-editor w-full">
      <EditorContent editor={editor} />
    </div>
  )
}
