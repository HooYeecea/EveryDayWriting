import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { LoginRequiredModal } from '../auth/LoginRequiredModal'
import { loadDraftById, loadLatestDraft, saveWritingDraft, submitWriting } from '../../api/writing'
import { useAuth } from '../../context/AuthContext'
import { NotionEditor } from '../editor/NotionEditor'
import { getRandomTopic } from '../../data/mockTopics'
import type { WritingTopic } from '../../types'

export function StartWriting() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const draftIdParam = searchParams.get('draftId')
  const [topic, setTopic] = useState<WritingTopic>(() => getRandomTopic())
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [draftId, setDraftId] = useState<string | undefined>()
  const [editorKey, setEditorKey] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    if (!user) return

    const loadDraft = draftIdParam
      ? loadDraftById(user.id, draftIdParam)
      : loadLatestDraft(user.id)

    loadDraft.then((draft) => {
      if (!draft) return
      setDraftId(draft.id)
      setTopic({
        id: draft.topicId,
        prompt: draft.topic,
        type: draft.topicType,
      })
      setTitle(draft.title)
      setContent(draft.content)
      setEditorKey((key) => key + 1)
    }).catch(() => {
      if (draftIdParam) {
        setSaveMessage('未找到指定草稿，已开始新写作')
      }
    })
  }, [user, draftIdParam])

  const promptLogin = (): boolean => {
    if (isAuthenticated && user) return true
    setShowLoginModal(true)
    return false
  }

  const handleChangeTopic = () => {
    setTopic(getRandomTopic(topic.id))
  }

  const handleSave = async () => {
    if (!promptLogin() || !user) return

    setIsSaving(true)
    setSaveMessage('')
    try {
      const record = await saveWritingDraft(user.id, {
        id: draftId,
        topicId: topic.id,
        topic: topic.prompt,
        topicType: topic.type,
        title,
        content,
      })
      setDraftId(record.id)
      setSaveMessage(`已保存 · ${new Date(record.time).toLocaleString()}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!promptLogin() || !user) return

    setIsSubmitting(true)
    try {
      const record = await submitWriting(user.id, {
        id: draftId,
        topicId: topic.id,
        topic: topic.prompt,
        topicType: topic.type,
        title,
        content,
      })
      setDraftId(undefined)
      alert(`提交成功！\n时间：${new Date(record.time).toLocaleString()}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-neutral-200 bg-white px-8 py-5">
        <div className="mx-auto flex max-w-4xl items-start gap-4">
          <div className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-neutral-400">
              题目
            </p>
            <p className="text-[15px] leading-relaxed text-neutral-800">{topic.prompt}</p>
          </div>
          <button
            type="button"
            onClick={handleChangeTopic}
            className="mt-1 flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
          >
            <RefreshCw size={14} />
            换一个题目
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl flex-1 px-8 py-8">
          <div className="relative mb-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="自定义标题"
              className={`w-full border-none bg-transparent text-2xl font-semibold text-neutral-900 outline-none placeholder:text-neutral-300 ${
                title.trim() ? 'text-center' : 'text-left'
              }`}
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-500">
                {topic.type}
              </span>
            </div>
          </div>

          <NotionEditor
            key={editorKey}
            content={content}
            onChange={setContent}
          />
        </div>

        <div className="sticky bottom-0 shrink-0 border-t border-neutral-200 bg-white px-8 py-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <p className="text-xs text-neutral-400">
              {!isAuthenticated
                ? '登录后可保存和提交'
                : saveMessage || (draftId ? '将继续编辑上次保存的内容' : '')}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-lg border border-neutral-200 bg-white px-6 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50 disabled:opacity-50"
              >
                {isSaving ? '保存中…' : '保存'}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? '提交中…' : '提交'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <LoginRequiredModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={() => {
          setShowLoginModal(false)
          navigate('/login', { state: { from: '/writing' } })
        }}
        onRegister={() => {
          setShowLoginModal(false)
          navigate('/register', { state: { from: '/writing' } })
        }}
      />
    </div>
  )
}
