import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef } from 'react'
import { TypingAnimation } from './typingAnimation'

interface NotionEditorProps {
  content?: string
  onChange?: (html: string) => void
  placeholder?: string
}

/** 编辑器销毁过程中 getHTML 会读到 null.cached（ProseMirror fromSchema） */
function readEditorHtml(editor: Editor): string | null {
  if (editor.isDestroyed) return null
  try {
    return editor.getHTML()
  } catch {
    return null
  }
}

export function NotionEditor({
  content = '',
  onChange,
  placeholder = 'Start writing',
}: NotionEditorProps) {
  const placeholderRef = useRef(placeholder)
  placeholderRef.current = placeholder

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: () => placeholderRef.current,
      }),
      TypingAnimation,
    ],
    content,
    // 挂载后再创建实例，降低 StrictMode / 快速换 key 时的销毁竞态
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        class: 'tiptap',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = readEditorHtml(ed)
      if (html == null) return
      onChange?.(html)
    },
  })

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const current = readEditorHtml(editor)
    if (current == null) return
    if (content !== current) {
      try {
        editor.commands.setContent(content || '', { emitUpdate: false })
      } catch {
        // 销毁中忽略
      }
    }
  }, [editor, content])

  // 语言切换后刷新占位符装饰
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    try {
      editor.view.dispatch(editor.state.tr)
    } catch {
      // ignore
    }
  }, [editor, placeholder])

  return (
    <div className="notion-editor w-full">
      <EditorContent editor={editor} />
    </div>
  )
}
