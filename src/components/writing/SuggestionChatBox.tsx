import { useEffect, useState, type FormEvent } from 'react'
import { MessageCircle } from 'lucide-react'
import { getSuggestionChatHistory, sendSuggestionChat } from '../../api/ai'
import type { ChatMessage } from '../../types'

interface SuggestionChatBoxProps {
  submitId: string
  suggestionId: string
  label: string
}

export function SuggestionChatBox({ submitId, suggestionId, label }: SuggestionChatBoxProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return

    setLoading(true)
    setError('')
    getSuggestionChatHistory(submitId, suggestionId)
      .then((data) => setMessages(data.messages))
      .catch((err) => setError(err instanceof Error ? err.message : '加载对话失败'))
      .finally(() => setLoading(false))
  }, [open, submitId, suggestionId])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!question.trim()) return

    setSubmitting(true)
    setError('')
    try {
      const result = await sendSuggestionChat(submitId, suggestionId, question.trim())
      setMessages(result.messages)
      setQuestion('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-3 border-t border-neutral-200 pt-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900"
      >
        <MessageCircle size={14} />
        {open ? '收起追问' : `针对「${label}」追问`}
      </button>

      {open && (
        <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-3">
          {loading && <p className="text-xs text-neutral-400">加载对话…</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}

          {messages.length > 0 && (
            <ul className="mb-3 max-h-48 space-y-2 overflow-y-auto">
              {messages.map((msg, index) => (
                <li
                  key={`${msg.role}-${index}`}
                  className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-neutral-100 text-neutral-800'
                      : 'bg-neutral-900 text-white'
                  }`}
                >
                  {msg.content}
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="输入你的问题…"
              maxLength={500}
              className="min-w-0 flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-xs outline-none focus:border-neutral-400"
            />
            <button
              type="submit"
              disabled={submitting || !question.trim()}
              className="shrink-0 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
            >
              {submitting ? '发送中…' : '发送'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
