import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { LoginRequiredModal } from '../auth/LoginRequiredModal'
import { loadDraftById, loadLatestDraft, saveWritingDraft, submitWriting } from '../../api/writing'
import { useAuth } from '../../context/AuthContext'
import { NotionEditor } from '../editor/NotionEditor'
import { TopicPromptBox } from '../writing/TopicPromptBox'
import { WritingAssistPanel } from '../writing/WritingAssistPanel'
import { getRandomTopic } from '../../data/mockTopics'
import {
  MAIN_CONTENT_X_CLASS,
  PANEL_FOOTER_CLASS,
  PANEL_FOOTER_INNER_CLASS,
  PANEL_SUBTITLE_CLASS,
  PANEL_TITLE_CLASS,
  PANEL_TOPIC_HEADER_CLASS,
} from '../layout/layoutConstants'
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className={`shrink-0 ${PANEL_TOPIC_HEADER_CLASS}`}>
        <div className="flex w-full flex-col items-stretch gap-3 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex w-full items-start justify-between gap-2 lg:block lg:w-auto lg:shrink-0">
            <div className="min-w-0">
              <p className={PANEL_TITLE_CLASS}>题目</p>
              <p className={`${PANEL_SUBTITLE_CLASS} truncate`}>{topic.type}</p>
            </div>
            <button
              type="button"
              onClick={handleChangeTopic}
              className="flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 lg:hidden"
            >
              <RefreshCw size={14} />
              换一个题目
            </button>
          </div>
          <TopicPromptBox prompt={topic.prompt} type={topic.type} />
          <button
            type="button"
            onClick={handleChangeTopic}
            className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 lg:flex lg:self-center"
          >
            <RefreshCw size={14} />
            换一个题目
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className={`mx-auto w-full max-w-3xl flex-1 overflow-y-auto py-5 sm:py-8 ${MAIN_CONTENT_X_CLASS}`}>
            <div className="mb-6">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="自定义标题"
                className={`w-full border-none bg-transparent text-xl font-semibold text-neutral-900 outline-none placeholder:text-neutral-300 sm:text-2xl ${
                  title.trim() ? 'text-center' : 'text-left'
                }`}
              />
            </div>

            <NotionEditor
              key={editorKey}
              content={content}
              onChange={setContent}
            />
          </div>

          <div className={PANEL_FOOTER_CLASS}>
            <div className={`${PANEL_FOOTER_INNER_CLASS} flex-col lg:flex-row`}>
              <p className="w-full text-left text-xs leading-none text-neutral-400 lg:min-w-0 lg:flex-1">
                {!isAuthenticated
                  ? '登录后可保存和提交'
                  : saveMessage || (draftId ? '将继续编辑上次保存的内容' : '')}
              </p>
              <div className="flex w-full shrink-0 items-center gap-2 lg:w-auto lg:gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex h-9 flex-1 items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 lg:flex-none lg:px-6"
                >
                  {isSaving ? '保存中…' : '保存'}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex h-9 flex-1 items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 lg:flex-none lg:px-6"
                >
                  {isSubmitting ? '提交中…' : '提交'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <WritingAssistPanel />
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
