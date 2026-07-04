import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { RefreshCw, RotateCcw } from 'lucide-react'
import { LoginRequiredModal } from '../auth/LoginRequiredModal'
import { useConfirmDialog } from '../common/ConfirmDialog'
import { loadLatestDraft, saveWritingDraft, submitWriting } from '../../api/writing'
import { getRandomTopic, topicToPrompt, type ApiTopicType } from '../../api/topics'
import { isApiError } from '../../api/request'
import { useAuth } from '../../context/AuthContext'
import { getMockRandomTopic } from '../../data/mockTopics'
import { NotionEditor } from '../editor/NotionEditor'
import { TopicPromptBox } from '../writing/TopicPromptBox'
import { TopicTypeSelect } from '../writing/TopicTypeSelect'
import { WritingAssistPanel } from '../writing/WritingAssistPanel'
import {
  MAIN_CONTENT_X_CLASS,
  PANEL_FOOTER_CLASS,
  PANEL_FOOTER_INNER_CLASS,
  PANEL_TITLE_CLASS,
  PANEL_TOPIC_HEADER_CLASS,
} from '../layout/layoutConstants'
import type { DraftConflictData, DraftSaveResult, WritingSavePayload, WritingTopic } from '../../types'

type RecordsTab = 'saves' | 'submits'

interface ActionFeedback {
  tone: 'success' | 'error' | 'info'
  message: string
  recordsTab?: RecordsTab
}

function isEditorEmpty(html: string): boolean {
  const text = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
  return text.length === 0
}

function draftToTopic(draft: { topicId: number | null; topic: string }): WritingTopic {
  return {
    id: draft.topicId ?? 0,
    type: 'Draft',
    title: draft.topic,
    description: draft.topic,
  }
}

export function StartWriting() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const draftIdParam = searchParams.get('draftId')

  const [topic, setTopic] = useState<WritingTopic>(() => getMockRandomTopic())
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [draftId, setDraftId] = useState<string | undefined>()
  const [draftUpdatedAt, setDraftUpdatedAt] = useState<string | undefined>()
  const [wordCount, setWordCount] = useState<number | undefined>()
  const [wordLimit, setWordLimit] = useState<number | undefined>()
  const [editorKey, setEditorKey] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [topicTypeFilter, setTopicTypeFilter] = useState<ApiTopicType | undefined>(undefined)
  const { confirm, dialog: confirmDialog } = useConfirmDialog()

  useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false

    async function initWritingPage() {
      try {
        const draft = await loadLatestDraft()
        if (cancelled) return

        if (draft) {
          if (draftIdParam && draft.id !== draftIdParam) {
            setFeedback({
              tone: 'info',
              message: '当前仅支持编辑最新草稿，已为您加载最新内容',
            })
          }
          setDraftId(draft.id)
          setDraftUpdatedAt(draft.updatedAt)
          setTopic(draftToTopic(draft))
          setTitle(draft.title)
          setContent(draft.content)
          setEditorKey((key) => key + 1)
          return
        }

        if (draftIdParam) {
          setFeedback({ tone: 'info', message: '未找到指定草稿，已开始新写作' })
        }

        try {
          const nextTopic = await getRandomTopic(topicTypeFilter)
          if (!cancelled) setTopic(nextTopic)
        } catch (err) {
          console.warn('[StartWriting] 初始化拉取题目失败，保留 mock 题目', err)
        }
      } catch (err) {
        if (cancelled) return
        setFeedback({
          tone: 'error',
          message: err instanceof Error ? err.message : '加载草稿失败',
        })
        try {
          const nextTopic = await getRandomTopic(topicTypeFilter)
          if (!cancelled) setTopic(nextTopic)
        } catch (err) {
          console.warn('[StartWriting] 加载草稿失败后拉取题目失败，保留 mock 题目', err)
        }
      }
    }

    void initWritingPage()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, draftIdParam])

  const promptLogin = (): boolean => {
    if (isAuthenticated && user) return true
    setShowLoginModal(true)
    return false
  }

  const handleChangeTopic = async () => {
    if (isAuthenticated) {
      try {
        const next = await getRandomTopic(topicTypeFilter)
        setTopic(next)
        return
      } catch (err) {
        console.warn('[StartWriting] 换一个题目接口失败，降级为 mock 题目', err)
      }
    }
    setTopic(getMockRandomTopic(topic.id))
  }

  const handleTopicTypeFilterChange = (value: ApiTopicType | undefined) => {
    setTopicTypeFilter(value)
  }

  const buildSavePayload = (): WritingSavePayload => ({
    topicId: topic.id > 0 ? topic.id : null,
    topic: topicToPrompt(topic),
    title: title.trim(),
    content,
  })

  const applySaveResult = (result: DraftSaveResult, createdNew = false) => {
    setDraftId(result.id)
    setDraftUpdatedAt(result.updatedAt)
    if (result.wordCount !== undefined) setWordCount(result.wordCount)
    if (result.wordLimit !== undefined) setWordLimit(result.wordLimit)

    const headline = createdNew ? '已另存为新草稿' : '保存成功'
    const stats =
      result.wordCount !== undefined && result.wordLimit !== undefined
        ? `（${result.wordCount} / ${result.wordLimit} 词）`
        : ''
    setFeedback({
      tone: 'success',
      message: `${headline}${stats}，可前往写作记录查看草稿`,
      recordsTab: 'saves',
    })
  }

  const performRewrite = () => {
    setTitle('')
    setContent('')
    setDraftId(undefined)
    setDraftUpdatedAt(undefined)
    setWordCount(undefined)
    setWordLimit(undefined)
    setEditorKey((key) => key + 1)
    setFeedback({ tone: 'info', message: '已开始新写作，保存时将创建新草稿' })

    if (draftIdParam) {
      navigate('/writing', { replace: true })
    }
  }

  const handleRewrite = async () => {
    const hasContent = title.trim().length > 0 || !isEditorEmpty(content)
    if (hasContent) {
      const confirmed = await confirm({
        title: '确认重写',
        message: (
          <>
            <p>将清空标题和正文，题目保持不变。</p>
            <p className="mt-2">下次保存会创建一篇新草稿，当前草稿不会被删除。</p>
          </>
        ),
        confirmLabel: '继续重写',
        cancelLabel: '取消',
      })
      if (!confirmed) return
    }

    performRewrite()
  }

  const handleSave = async () => {
    if (!promptLogin()) return

    if (isEditorEmpty(content)) {
      setFeedback({ tone: 'error', message: '请先输入正文再保存' })
      return
    }

    setIsSaving(true)
    setFeedback(null)

    const payload = buildSavePayload()

    try {
      const previousDraftId = draftId
      const result = await saveWritingDraft(draftId, payload, draftUpdatedAt)
      const createdNew = Boolean(previousDraftId && previousDraftId !== result.id)
      applySaveResult(result, createdNew)
    } catch (err) {
      if (isApiError(err) && err.code === 409 && draftId) {
        const conflict = err.data as DraftConflictData | null
        const overwrite = await confirm({
          title: '保存冲突',
          variant: 'warning',
          message: (
            <>
              <p>{err.message}</p>
              <p className="mt-2">选择「覆盖保存」用当前内容保存；选择「加载最新」获取其他设备的版本。</p>
            </>
          ),
          confirmLabel: '覆盖保存',
          cancelLabel: '加载最新',
        })

        if (overwrite) {
          try {
            const result = await saveWritingDraft(draftId, payload)
            applySaveResult(result)
            return
          } catch (retryErr) {
            setFeedback({
              tone: 'error',
              message: retryErr instanceof Error ? retryErr.message : '覆盖保存失败',
            })
            return
          }
        }

        if (conflict) {
          setTitle(conflict.title)
          setContent(conflict.content)
          setDraftUpdatedAt(conflict.updatedAt)
          setEditorKey((key) => key + 1)
          setFeedback({ tone: 'info', message: '已加载其他设备的最新内容' })
        } else {
          setFeedback({ tone: 'error', message: err.message })
        }
        return
      }

      setFeedback({
        tone: 'error',
        message: err instanceof Error ? err.message : '保存失败',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!promptLogin()) return

    if (isEditorEmpty(content)) {
      setFeedback({ tone: 'error', message: '请先输入正文再提交' })
      return
    }

    setIsSubmitting(true)
    setFeedback(null)
    try {
      const result = await submitWriting({
        topicId: topic.id,
        topic: topicToPrompt(topic),
        title: title.trim(),
        content,
        draftId,
      })
      setDraftId(undefined)
      setDraftUpdatedAt(undefined)
      setWordCount(undefined)
      setWordLimit(undefined)

      const scorePart =
        result.aiScore !== null ? ` AI 评分 ${result.aiScore} 分。` : ' AI 评分暂不可用。'
      const stats =
        result.wordCount !== undefined && result.wordLimit !== undefined
          ? `（${result.wordCount} / ${result.wordLimit} 词）`
          : ''
      setFeedback({
        tone: 'success',
        message: `提交成功${stats}${scorePart}可前往写作记录查看提交记录`,
        recordsTab: 'submits',
      })
    } catch (err) {
      setFeedback({
        tone: 'error',
        message: err instanceof Error ? err.message : '提交失败',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const idleFooterStatus = (() => {
    if (!isAuthenticated) return '登录后可保存和提交'
    if (wordCount !== undefined && wordLimit !== undefined) {
      const mode = draftId ? '编辑中' : '新写作'
      return `${wordCount} / ${wordLimit} 词 · ${mode}`
    }
    if (draftId) return '编辑中 · 保存将更新当前草稿'
    return '新写作 · 保存将创建草稿'
  })()

  const feedbackToneClass =
    feedback?.tone === 'success'
      ? 'text-green-700'
      : feedback?.tone === 'error'
        ? 'text-red-600'
        : 'text-neutral-500'

  const topicPrompt = topicToPrompt(topic)

  const changeTopicButtonClass =
    'flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900'

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className={`shrink-0 ${PANEL_TOPIC_HEADER_CLASS}`}>
        <div className="flex w-full items-center gap-3 sm:gap-4">
          <p className={`${PANEL_TITLE_CLASS} shrink-0`}>题目</p>
          <TopicPromptBox prompt={topicPrompt} type={topic.type} />
          <div className="flex shrink-0 items-center gap-2">
            <TopicTypeSelect value={topicTypeFilter} onChange={handleTopicTypeFilterChange} />
            <button type="button" onClick={handleChangeTopic} className={changeTopicButtonClass}>
              <RefreshCw size={14} />
              换一个题目
            </button>
          </div>
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

            <NotionEditor key={editorKey} content={content} onChange={setContent} />
          </div>

          <div className={PANEL_FOOTER_CLASS}>
            <div className={`${PANEL_FOOTER_INNER_CLASS} flex-col lg:flex-row`}>
              <div className="w-full text-left text-xs leading-snug lg:min-w-0 lg:flex-1">
                {feedback ? (
                  <div className={feedbackToneClass}>
                    <p>{feedback.message}</p>
                    {feedback.tone === 'success' && feedback.recordsTab && (
                      <Link
                        to="/records"
                        state={{ tab: feedback.recordsTab }}
                        className="mt-1 inline-block font-medium text-green-800 underline underline-offset-2 hover:text-green-900"
                      >
                        前往写作记录
                      </Link>
                    )}
                  </div>
                ) : (
                  <p className="leading-none text-neutral-400">{idleFooterStatus}</p>
                )}
              </div>
              <div className="flex w-full shrink-0 items-center gap-2 lg:w-auto lg:gap-3">
                <button
                  type="button"
                  onClick={handleRewrite}
                  disabled={isSaving || isSubmitting}
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 lg:flex-none lg:px-4"
                  title="清空标题和正文，下次保存创建新草稿"
                >
                  <RotateCcw size={14} />
                  重写
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
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
      {confirmDialog}
    </div>
  )
}
