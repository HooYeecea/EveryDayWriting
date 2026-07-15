import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { RefreshCw, RotateCcw, Wand2 } from 'lucide-react'
import { LoginRequiredModal } from '../auth/LoginRequiredModal'
import { useConfirmDialog } from '../common/ConfirmDialog'
import { loadDraftById, loadLatestDraft, getSubmittedWritingById, iterateSubmit, saveWritingDraft, submitWriting } from '../../api/writing'
import { runPreSubmitGrading } from '../../api/aiGrading'
import { saveGradingPreview, type GradingStageKey } from '../../storage/gradingPreviewStorage'
import { getRandomTopic, topicToPrompt } from '../../api/topics'
import { isApiError } from '../../api/request'
import { useAuth } from '../../context/AuthContext'
import { getMockRandomTopic } from '../../data/mockTopics'
import { loadAiAssistSettings } from '../../storage/aiSettingsStorage'
import { isTypingAnimationEnabled, setTypingAnimationEnabled } from '../../storage/typingAnimationStorage'
import {
  loadTopicPanelHeight,
  saveTopicPanelHeight,
} from '../../storage/topicPanelHeightStorage'
import { NotionEditor } from '../editor/NotionEditor'
import { TopicPromptBox } from '../writing/TopicPromptBox'
import { TopicTypeSelect } from '../writing/TopicTypeSelect'
import { WritingAssistPanel } from '../writing/WritingAssistPanel'
import {
  MAIN_CONTENT_X_CLASS,
  PANEL_FOOTER_CLASS,
  PANEL_FOOTER_INNER_CLASS,
} from '../layout/layoutConstants'
import type { DraftConflictData, DraftSaveResult, WritingSavePayload, WritingTopic } from '../../types'

const TOPIC_PANEL_MIN_HEIGHT_MOBILE = 130
const TOPIC_PANEL_MIN_HEIGHT_DESKTOP = 88 // 5.5rem，与侧栏品牌区底部分割线对齐
const TOPIC_PANEL_MAX_RATIO = 0.55

function getTopicPanelMinHeight(): number {
  if (typeof window === 'undefined') return TOPIC_PANEL_MIN_HEIGHT_DESKTOP
  return window.matchMedia('(min-width: 640px)').matches
    ? TOPIC_PANEL_MIN_HEIGHT_DESKTOP
    : TOPIC_PANEL_MIN_HEIGHT_MOBILE
}

type RecordsTab = 'saves' | 'submits'

interface ActionFeedback {
  tone: 'success' | 'error' | 'info'
  message: string
  recordsTab?: RecordsTab
  submitId?: string
}

function isEditorEmpty(html: string): boolean {
  const text = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
  return text.length === 0
}

function buildSubmitSnapshot(title: string, content: string) {
  return `${title.trim()}|||${content}`
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
  const iterateFromParam = searchParams.get('iterateFrom')

  const [topic, setTopic] = useState<WritingTopic>(() => getMockRandomTopic())
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [draftId, setDraftId] = useState<string | undefined>()
  const [iterateFromId, setIterateFromId] = useState<string | undefined>()
  const [draftUpdatedAt, setDraftUpdatedAt] = useState<string | undefined>()
  const [wordCount, setWordCount] = useState<number | undefined>()
  const [wordLimit, setWordLimit] = useState<number | undefined>()
  const [editorKey, setEditorKey] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitPhase, setSubmitPhase] = useState<'idle' | 'grading' | 'submitting'>('idle')
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [topicTypeFilter, setTopicTypeFilter] = useState<string | undefined>(undefined)
  const [submittedSnapshot, setSubmittedSnapshot] = useState<string | null>(null)
  const [iterateBaselineSnapshot, setIterateBaselineSnapshot] = useState<string | null>(null)
  const submitLockRef = useRef(false)
  const preserveWritingSessionRef = useRef(false)
  const pageRef = useRef<HTMLDivElement>(null)
  const topicPanelRef = useRef<HTMLDivElement>(null)
  const topicHeightRef = useRef<number>(loadTopicPanelHeight() ?? getTopicPanelMinHeight())
  const writingScrollRef = useRef<HTMLDivElement>(null)
  const writingScrollHideTimerRef = useRef<number | null>(null)
  const [typingAnimOn, setTypingAnimOn] = useState(() => isTypingAnimationEnabled())
  const [topicHeight, setTopicHeight] = useState(
    () => loadTopicPanelHeight() ?? getTopicPanelMinHeight(),
  )
  const [isResizingTopic, setIsResizingTopic] = useState(false)
  const { confirm, dialog: confirmDialog } = useConfirmDialog()

  const clampTopicHeight = (height: number) => {
    const minHeight = getTopicPanelMinHeight()
    const pageHeight = pageRef.current?.clientHeight ?? window.innerHeight
    const maxHeight = Math.max(minHeight, Math.floor(pageHeight * TOPIC_PANEL_MAX_RATIO))
    return Math.min(maxHeight, Math.max(minHeight, Math.round(height)))
  }

  useEffect(() => {
    topicHeightRef.current = topicHeight
  }, [topicHeight])

  useEffect(() => {
    const syncHeight = () => {
      setTopicHeight((current) => {
        const next = clampTopicHeight(current)
        if (next !== current && loadTopicPanelHeight() != null) {
          saveTopicPanelHeight(next)
        }
        return next
      })
    }

    syncHeight()
    window.addEventListener('resize', syncHeight)
    return () => window.removeEventListener('resize', syncHeight)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- measure against live pageRef
  }, [])

  const handleTopicResizePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const panel = topicPanelRef.current
    if (!panel) return

    event.preventDefault()
    const startY = event.clientY
    const startHeight = panel.getBoundingClientRect().height
    const handle = event.currentTarget
    handle.setPointerCapture(event.pointerId)
    setIsResizingTopic(true)
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'

    const onPointerMove = (moveEvent: PointerEvent) => {
      const next = clampTopicHeight(startHeight + (moveEvent.clientY - startY))
      topicHeightRef.current = next
      setTopicHeight(next)
    }

    const onPointerUp = (upEvent: PointerEvent) => {
      handle.releasePointerCapture(upEvent.pointerId)
      handle.removeEventListener('pointermove', onPointerMove)
      handle.removeEventListener('pointerup', onPointerUp)
      handle.removeEventListener('pointercancel', onPointerUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setIsResizingTopic(false)
      saveTopicPanelHeight(topicHeightRef.current)
    }

    handle.addEventListener('pointermove', onPointerMove)
    handle.addEventListener('pointerup', onPointerUp)
    handle.addEventListener('pointercancel', onPointerUp)
  }

  const handleWritingScroll = () => {
    const el = writingScrollRef.current
    if (!el) return
    el.classList.add('is-scrolling')
    if (writingScrollHideTimerRef.current != null) {
      window.clearTimeout(writingScrollHideTimerRef.current)
    }
    writingScrollHideTimerRef.current = window.setTimeout(() => {
      el.classList.remove('is-scrolling')
      writingScrollHideTimerRef.current = null
    }, 900)
  }

  useEffect(() => {
    return () => {
      if (writingScrollHideTimerRef.current != null) {
        window.clearTimeout(writingScrollHideTimerRef.current)
      }
    }
  }, [])

  const currentSubmitSnapshot = buildSubmitSnapshot(title, content)
  const isContentAlreadySubmitted = submittedSnapshot === currentSubmitSnapshot
  const isIterateUnchanged =
    Boolean(iterateFromId) &&
    iterateBaselineSnapshot !== null &&
    iterateBaselineSnapshot === currentSubmitSnapshot

  useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false

    async function initWritingPage() {
      if (preserveWritingSessionRef.current && !draftIdParam && !iterateFromParam) {
        return
      }

      try {
        if (iterateFromParam) {
          try {
            const submit = await getSubmittedWritingById(iterateFromParam)
            if (cancelled) return

            preserveWritingSessionRef.current = true
            setIterateFromId(submit.id)
            setDraftId(undefined)
            setDraftUpdatedAt(undefined)
            setTopic({
              id: submit.topicId,
              type: submit.topicType,
              title: submit.topic,
              description: submit.topic,
            })
            setTitle(submit.title)
            setContent(submit.content)
            setSubmittedSnapshot(null)
            setIterateBaselineSnapshot(buildSubmitSnapshot(submit.title, submit.content))
            setEditorKey((key) => key + 1)
            setFeedback({
              tone: 'info',
              message: `正在基于第 ${submit.iterationNumber ?? 1} 版提交进行迭代改进`,
            })
            return
          } catch (err) {
            if (cancelled) return
            setFeedback({
              tone: 'error',
              message: err instanceof Error ? err.message : '加载原提交失败',
            })
          }
        }

        if (draftIdParam) {
          try {
            const draft = await loadDraftById(draftIdParam)
            if (cancelled) return

            setDraftId(draft.id)
            setDraftUpdatedAt(draft.updatedAt)
            setTopic(draftToTopic(draft))
            setTitle(draft.title)
            setContent(draft.content)
            setSubmittedSnapshot(null)
            setEditorKey((key) => key + 1)
            return
          } catch (err) {
            if (cancelled) return
            setFeedback({
              tone: 'info',
              message: err instanceof Error ? err.message : '未找到指定草稿，已尝试加载最新草稿',
            })
          }
        }

        const draft = await loadLatestDraft()
        if (cancelled) return

        if (draft) {
          setDraftId(draft.id)
          setDraftUpdatedAt(draft.updatedAt)
          setTopic(draftToTopic(draft))
          setTitle(draft.title)
          setContent(draft.content)
          setSubmittedSnapshot(null)
          setEditorKey((key) => key + 1)
          return
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
  }, [isAuthenticated, draftIdParam, iterateFromParam])

  const promptLogin = (): boolean => {
    if (isAuthenticated && user) return true
    setShowLoginModal(true)
    return false
  }

  const handleToggleTypingAnim = () => {
    setTypingAnimOn((prev) => {
      const next = !prev
      setTypingAnimationEnabled(next)
      return next
    })
  }

  const handleChangeTopic = async () => {
    setSubmittedSnapshot(null)
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

  const handleTopicTypeFilterChange = (value: string | undefined) => {
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
    preserveWritingSessionRef.current = false
    setTitle('')
    setContent('')
    setDraftId(undefined)
    setDraftUpdatedAt(undefined)
    setIterateFromId(undefined)
    setSubmittedSnapshot(null)
    setIterateBaselineSnapshot(null)
    setWordCount(undefined)
    setWordLimit(undefined)
    setEditorKey((key) => key + 1)
    setFeedback({ tone: 'info', message: '已开始新写作，保存时将创建新草稿' })

    if (draftIdParam || iterateFromParam) {
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
    if (submitLockRef.current || isSubmitting) return

    if (isEditorEmpty(content)) {
      setFeedback({ tone: 'error', message: '请先输入正文再提交' })
      return
    }

    if (isContentAlreadySubmitted) {
      setFeedback({ tone: 'info', message: '当前内容已提交，修改后再提交' })
      return
    }

    if (isIterateUnchanged) {
      setFeedback({ tone: 'info', message: '内容相对最新版没有变化，请先修改后再提交' })
      return
    }

    submitLockRef.current = true
    setIsSubmitting(true)
    setSubmitPhase('idle')
    setFeedback(null)
    try {
      const settings = loadAiAssistSettings()
      const hasAiTasks =
        settings.encryptedKey &&
        settings.providerId &&
        settings.modelId &&
        (settings.postSubmitReview || settings.postSubmitStructure || settings.postSubmitSuggestions)

      let gradingSessionId: string | undefined
      let completedTasks: string[] = []
      let failedTasks: string[] = []
      let stageContents: Partial<Record<GradingStageKey, unknown>> = {}

      if (hasAiTasks) {
        setSubmitPhase('grading')
        const grading = await runPreSubmitGrading(content)
        gradingSessionId = grading.gradingSessionId
        completedTasks = grading.completedTasks
        failedTasks = grading.failedTasks
        stageContents = grading.stageContents
      }

      setSubmitPhase('submitting')

      if (iterateFromId) {
        const result = await iterateSubmit(iterateFromId, {
          title: title.trim(),
          content,
          gradingSessionId,
        })

        if (result.id && Object.keys(stageContents).length > 0) {
          saveGradingPreview(result.id, stageContents)
        }

        const aiSuccess =
          completedTasks.length > 0 ? ` 已完成 ${completedTasks.join('、')}。` : ''
        const aiFailed =
          failedTasks.length > 0 ? ` ${failedTasks.join('、')}未能完成。` : ''
        const aiViewHint =
          completedTasks.length > 0 && gradingSessionId
            ? ' 可前往写作记录查看 AI 批改结果。'
            : ''
        const stats =
          result.wordCount !== undefined && result.wordLimit !== undefined
            ? `（${result.wordCount} / ${result.wordLimit} 词）`
            : ''

        setIterateFromId(result.id)
        preserveWritingSessionRef.current = true
        navigate('/writing', { replace: true })

        setFeedback({
          tone: failedTasks.length > 0 && completedTasks.length === 0 ? 'info' : 'success',
          message: `迭代提交成功，当前为第 ${result.iterationNumber} 版${stats}${aiSuccess}${aiFailed}${aiViewHint}`,
          recordsTab: 'submits',
          submitId: result.id,
        })
        setSubmittedSnapshot(currentSubmitSnapshot)
        setIterateBaselineSnapshot(currentSubmitSnapshot)
        return
      }

      const result = await submitWriting({
        topicId: topic.id,
        topic: topicToPrompt(topic),
        title: title.trim(),
        content,
        draftId,
        gradingSessionId,
      })
      if (result.id && Object.keys(stageContents).length > 0) {
        saveGradingPreview(result.id, stageContents)
      }
      setDraftId(undefined)
      setDraftUpdatedAt(undefined)
      setWordCount(undefined)
      setWordLimit(undefined)

      const aiSuccess =
        completedTasks.length > 0 ? ` 已完成 ${completedTasks.join('、')}。` : ''
      const aiFailed =
        failedTasks.length > 0 ? ` ${failedTasks.join('、')}未能完成。` : ''
      const aiViewHint =
        completedTasks.length > 0 && gradingSessionId
          ? ' 可前往写作记录查看 AI 批改结果。'
          : ''

      const scorePart =
        result.aiScore !== null ? ` AI 评分 ${result.aiScore} 分。` : ''
      const stats =
        result.wordCount !== undefined && result.wordLimit !== undefined
          ? `（${result.wordCount} / ${result.wordLimit} 词）`
          : ''
      setFeedback({
        tone: failedTasks.length > 0 && completedTasks.length === 0 ? 'info' : 'success',
        message: `提交成功${stats}${scorePart}${aiSuccess}${aiFailed}${aiViewHint}`,
        recordsTab: 'submits',
        submitId: result.id,
      })
      setSubmittedSnapshot(currentSubmitSnapshot)
    } catch (err) {
      setFeedback({
        tone: 'error',
        message: err instanceof Error ? err.message : '提交失败',
      })
    } finally {
      submitLockRef.current = false
      setIsSubmitting(false)
      setSubmitPhase('idle')
    }
  }

  const idleFooterStatus = (() => {
    if (!isAuthenticated) return '登录后可保存和提交'
    if (wordCount !== undefined && wordLimit !== undefined) {
      const mode = draftId ? '编辑中' : '新写作'
      return `${wordCount} / ${wordLimit} 词 · ${mode}`
    }
    if (iterateFromId) {
      if (isIterateUnchanged) return '相对最新版无变化 · 修改后可提交'
      return '迭代改进中 · 提交将创建新版本'
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
    'flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-sm text-neutral-600 transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 active:scale-[0.97] sm:w-full sm:flex-none sm:px-3'

  // 手机：类型 + 换题横排；桌面：上换题 / 下类型，同宽竖排
  const topicControls = (
    <div className="flex w-full shrink-0 items-center gap-2 self-start sm:w-[7.75rem] sm:flex-col sm:items-stretch sm:justify-center sm:gap-2 sm:self-stretch">
      <button type="button" onClick={handleChangeTopic} className={`${changeTopicButtonClass} order-2 sm:order-1`}>
        <RefreshCw size={14} className="shrink-0" />
        <span className="truncate">换一个题目</span>
      </button>
      <TopicTypeSelect
        value={topicTypeFilter}
        onChange={handleTopicTypeFilterChange}
        rootClassName="order-1 sm:order-2 sm:w-full"
        className="sm:!w-full sm:!min-w-0"
      />
    </div>
  )

  return (
    <div ref={pageRef} className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={topicPanelRef}
        className="relative flex shrink-0 flex-col overflow-hidden border-b border-neutral-200 bg-white"
        style={{ height: topicHeight }}
      >
        <div
          className={`mx-auto flex h-full min-h-0 w-full min-w-0 max-w-5xl flex-col gap-2 py-2.5 sm:flex-row sm:items-stretch sm:gap-3 sm:py-2.5 ${MAIN_CONTENT_X_CLASS}`}
        >
          <div className="flex min-h-0 min-w-0 flex-1 items-stretch gap-2.5 sm:gap-3">
            <p className="hidden shrink-0 self-center text-center font-sans text-lg font-semibold leading-snug tracking-wide text-neutral-600 sm:block">
              <span className="block">写作</span>
              <span className="block">题目</span>
            </p>
            <div className="min-h-0 min-w-0 flex-1">
              <TopicPromptBox fill prompt={topicPrompt} type={topic.type} />
            </div>
          </div>
          {topicControls}
        </div>

        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="拖动调节题目区域高度"
          aria-valuemin={TOPIC_PANEL_MIN_HEIGHT_DESKTOP}
          aria-valuemax={Math.floor(
            (pageRef.current?.clientHeight ?? 800) * TOPIC_PANEL_MAX_RATIO,
          )}
          aria-valuenow={topicHeight}
          tabIndex={0}
          onPointerDown={handleTopicResizePointerDown}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
            event.preventDefault()
            const next = clampTopicHeight(
              topicHeight + (event.key === 'ArrowDown' ? 16 : -16),
            )
            setTopicHeight(next)
            saveTopicPanelHeight(next)
          }}
          className="absolute inset-x-0 bottom-0 z-10 flex h-3 translate-y-1/2 cursor-row-resize touch-none items-center justify-center"
        >
          <span
            className={`h-1 w-10 rounded-full transition-colors duration-200 ${
              isResizingTopic
                ? 'bg-neutral-500'
                : 'bg-neutral-300/90 hover:bg-neutral-400'
            }`}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div
            ref={writingScrollRef}
            onScroll={handleWritingScroll}
            className={`writing-area-scroll mx-auto w-full min-w-0 max-w-5xl flex-1 overflow-x-hidden overflow-y-auto py-5 sm:py-8 ${MAIN_CONTENT_X_CLASS}`}
          >
            <div className="flex min-h-full flex-col">
              <div className="mb-6 shrink-0">
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
          </div>

          <div className={PANEL_FOOTER_CLASS}>
            <div className={`${PANEL_FOOTER_INNER_CLASS} mx-auto max-w-5xl flex-col lg:flex-row`}>
              <div className="flex w-full flex-wrap items-center gap-3 text-left text-xs leading-snug lg:min-w-0 lg:flex-1">
                <button
                  type="button"
                  onClick={handleToggleTypingAnim}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-200 active:scale-95 ${
                    typingAnimOn
                      ? 'border-neutral-300 bg-neutral-100 text-neutral-700'
                      : 'border-neutral-200 bg-white text-neutral-400'
                  }`}
                  title={typingAnimOn ? '打字动效已开启，点击关闭' : '打字动效已关闭，点击开启'}
                >
                  <Wand2 size={13} strokeWidth={typingAnimOn ? 2 : 1.5} />
                  打字动效
                </button>
                {feedback ? (
                  <div className={feedbackToneClass}>
                    <p>{feedback.message}</p>
                    {feedback.tone === 'success' && feedback.recordsTab && (
                      <Link
                        to="/records"
                        state={{ tab: feedback.recordsTab, selectedId: feedback.submitId }}
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
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-600 transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.97] disabled:opacity-50 lg:flex-none lg:px-4"
                  title="清空标题和正文，下次保存创建新草稿"
                >
                  <RotateCcw size={14} />
                  重写
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                  className="flex h-9 flex-1 items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.97] disabled:opacity-50 lg:flex-none lg:px-6"
                >
                  {isSaving ? '保存中…' : '保存'}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || isContentAlreadySubmitted || isIterateUnchanged}
                  title={
                    isContentAlreadySubmitted
                      ? '当前内容已提交，修改后可再次提交'
                      : isIterateUnchanged
                        ? '内容相对最新版没有变化，请先修改后再提交'
                        : undefined
                  }
                  className="flex h-9 flex-1 items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97] disabled:opacity-50 lg:flex-none lg:px-6"
                >
                  {isSubmitting
                    ? submitPhase === 'grading'
                      ? 'AI 批改中…'
                      : '提交中…'
                    : isContentAlreadySubmitted
                      ? '已提交'
                      : isIterateUnchanged
                        ? '无变化'
                        : '提交'}
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
