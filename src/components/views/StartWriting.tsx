import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Maximize2, RefreshCw, RotateCcw, Wand2, X } from 'lucide-react'
import { LoginRequiredModal } from '../auth/LoginRequiredModal'
import { useConfirmDialog } from '../common/ConfirmDialog'
import { autoSaveDraft, loadDraftById, getSubmittedWritingById, iterateSubmit, persistSubmitAiResults, saveWritingDraft, submitWriting } from '../../api/writing'
import { runPreSubmitGrading } from '../../api/aiGrading'
import { saveGradingPreview, type GradingStageKey } from '../../storage/gradingPreviewStorage'
import { getRandomTopic, topicToPrompt } from '../../api/topics'
import { isApiError } from '../../api/request'
import { useAuth } from '../../context/AuthContext'
import { useReportReady } from '../../hooks/useReportReady'
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

/** 未获取题目时的空状态（刷新后默认） */
const EMPTY_TOPIC: WritingTopic = {
  id: 0,
  type: '',
  title: '',
  description: '',
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

export function StartWriting({ onReady }: { onReady?: () => void } = {}) {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const draftIdParam = searchParams.get('draftId')
  const iterateFromParam = searchParams.get('iterateFrom')

  const [topic, setTopic] = useState<WritingTopic>(EMPTY_TOPIC)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [draftId, setDraftId] = useState<string | undefined>()
  const [iterateFromId, setIterateFromId] = useState<string | undefined>()
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
  const [initialLoading, setInitialLoading] = useState(true)

  useReportReady(!initialLoading, onReady)
  const submitLockRef = useRef(false)
  const preserveWritingSessionRef = useRef(false)
  const draftIdRef = useRef<string | undefined>(undefined)
  const draftUpdatedAtRef = useRef<string | undefined>(undefined)
  const iterateFromIdRef = useRef<string | undefined>(undefined)
  /** 串行化自动/手动保存，避免并发创建两条草稿 */
  const draftSaveChainRef = useRef(Promise.resolve())
  const autoSaveTimerRef = useRef<number | null>(null)
  const lastAutoSavedHashRef = useRef<string>('')
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
  const [writingFullscreen, setWritingFullscreen] = useState(false)
  const { confirm, dialog: confirmDialog } = useConfirmDialog()

  const assignDraftMeta = (id: string | undefined, updatedAt: string | undefined) => {
    draftIdRef.current = id
    draftUpdatedAtRef.current = updatedAt
    setDraftId(id)
  }

  const assignIterateFrom = (id: string | undefined) => {
    iterateFromIdRef.current = id
    setIterateFromId(id)
  }

  const enqueueDraftSave = <T,>(task: () => Promise<T>): Promise<T> => {
    const next = draftSaveChainRef.current.then(task, task)
    draftSaveChainRef.current = next.then(
      () => undefined,
      () => undefined,
    )
    return next
  }

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
    if (!writingFullscreen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setWritingFullscreen(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [writingFullscreen])

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
  const hasTopic = Boolean(topicToPrompt(topic).trim())
  /** 已绑定草稿或迭代提交后锁定题目，禁止更换 */
  const topicLocked = Boolean(draftId || iterateFromId)

  useEffect(() => {
    if (!isAuthenticated) {
      setInitialLoading(false)
      return
    }

    let cancelled = false

    async function initWritingPage() {
      if (preserveWritingSessionRef.current && !draftIdParam && !iterateFromParam) {
        if (!cancelled) setInitialLoading(false)
        return
      }

      setInitialLoading(true)

      try {
        if (iterateFromParam) {
          try {
            const submit = await getSubmittedWritingById(iterateFromParam)
            if (cancelled) return

            preserveWritingSessionRef.current = true
            assignIterateFrom(submit.id)
            assignDraftMeta(undefined, undefined)
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

            preserveWritingSessionRef.current = true
            assignDraftMeta(draft.id, draft.updatedAt)
            setTopic(draftToTopic(draft))
            setTitle(draft.title)
            setContent(draft.content)
            setSubmittedSnapshot(null)

            const sourceSubmitId = draft.sourceSubmitId || undefined
            assignIterateFrom(sourceSubmitId)
            if (sourceSubmitId) {
              try {
                const source = await getSubmittedWritingById(sourceSubmitId)
                if (cancelled) return
                setIterateBaselineSnapshot(buildSubmitSnapshot(source.title, source.content))
                setFeedback({
                  tone: 'info',
                  message: `正在基于第 ${source.iterationNumber ?? 1} 版提交进行迭代改进（来自草稿）`,
                })
              } catch {
                setIterateBaselineSnapshot(null)
                setFeedback({
                  tone: 'info',
                  message: '已加载迭代草稿，保存后提交将挂到关联的提交记录',
                })
              }
            } else {
              setIterateBaselineSnapshot(null)
              setFeedback(null)
            }
            setEditorKey((key) => key + 1)
            return
          } catch (err) {
            if (cancelled) return
            setFeedback({
              tone: 'info',
              message: err instanceof Error ? err.message : '未找到指定草稿，请重新获取题目或从写作记录进入',
            })
          }
        }

        // 刷新 / 无 draftId：空白起步，不自动恢复草稿或随机题目
        if (!cancelled) {
          assignDraftMeta(undefined, undefined)
          setTopic(EMPTY_TOPIC)
          setTitle('')
          setContent('')
          assignIterateFrom(undefined)
          setSubmittedSnapshot(null)
          setIterateBaselineSnapshot(null)
          setWordCount(undefined)
          setWordLimit(undefined)
          setEditorKey((key) => key + 1)
          lastAutoSavedHashRef.current = ''
        }
      } catch (err) {
        if (cancelled) return
        setFeedback({
          tone: 'error',
          message: err instanceof Error ? err.message : '加载失败',
        })
      } finally {
        if (!cancelled) setInitialLoading(false)
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

  // ── 自动保存：localStorage + 服务器 ──
  const localStorageKey = topic ? `auto_save_draft_${topic.id}` : 'auto_save_draft_0'

  // 内容变化 → localStorage（仅作会话内备份；刷新后不恢复，避免题目与正文错位）
  useEffect(() => {
    if (!isAuthenticated) return
    try {
      if (title || content) {
        localStorage.setItem(localStorageKey, JSON.stringify({ title, content }))
      }
    } catch { /* ignore */ }
  }, [title, content, isAuthenticated, localStorageKey])

  // 服务器自动保存（停止输入 3s 后触发；与手动保存共用同一草稿）
  useEffect(() => {
    if (!isAuthenticated || !topic || topic.id === 0) return

    const hash = `${title}||${content}`
    if (hash === lastAutoSavedHashRef.current) return

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)

    autoSaveTimerRef.current = window.setTimeout(() => {
      if (isEditorEmpty(content)) return

      const sourceSubmitId = iterateFromIdRef.current
      const payload: WritingSavePayload = {
        topicId: topic.id > 0 ? topic.id : null,
        topic: topicToPrompt(topic),
        title: title.trim(),
        content,
        ...(sourceSubmitId ? { sourceSubmitId } : {}),
      }
      const snapshotHash = hash

      void enqueueDraftSave(async () => {
        try {
          const result = await autoSaveDraft(draftIdRef.current, payload)
          preserveWritingSessionRef.current = true
          assignDraftMeta(result.id, result.updatedAt)
          lastAutoSavedHashRef.current = snapshotHash
          if (result.wordCount !== undefined) setWordCount(result.wordCount)
          if (result.wordLimit !== undefined) setWordLimit(result.wordLimit)
        } catch {
          // 静默失败，不打扰用户
        }
      })
    }, 3000)

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, topic, isAuthenticated])

  // 页面关闭前紧急写入 localStorage
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        if (title || content) {
          localStorage.setItem(localStorageKey, JSON.stringify({ title, content }))
        }
      } catch { /* ignore */ }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [title, content, localStorageKey])

  // 提交/手动保存成功后清除 localStorage
  useEffect(() => {
    if (feedback?.tone === 'success') {
      try {
        localStorage.removeItem(localStorageKey)
      } catch { /* ignore */ }
    }
  }, [feedback, localStorageKey])

  const handleChangeTopic = async () => {
    if (draftIdRef.current || iterateFromIdRef.current) {
      setFeedback({
        tone: 'info',
        message: '当前草稿题目已锁定。如需换题，请先点击「重写」后重新获取题目。',
      })
      return
    }

    setSubmittedSnapshot(null)
    if (isAuthenticated) {
      try {
        const next = await getRandomTopic(topicTypeFilter)
        preserveWritingSessionRef.current = true
        setTopic(next)
        return
      } catch (err) {
        console.warn('[StartWriting] 换一个题目接口失败，降级为 mock 题目', err)
      }
    }
    preserveWritingSessionRef.current = true
    setTopic(getMockRandomTopic(topic.id || undefined))
  }

  const handleTopicTypeFilterChange = (value: string | undefined) => {
    if (draftIdRef.current || iterateFromIdRef.current) {
      setFeedback({
        tone: 'info',
        message: '当前草稿题目已锁定。如需换题，请先点击「重写」后重新获取题目。',
      })
      return
    }
    setTopicTypeFilter(value)
  }

  const notifyTopicLocked = () => {
    setFeedback({
      tone: 'info',
      message: '当前草稿题目已锁定。如需换题，请先点击「重写」后重新获取题目。',
    })
  }

  const buildSavePayload = (): WritingSavePayload => {
    const sourceSubmitId = iterateFromIdRef.current
    return {
      topicId: topic.id > 0 ? topic.id : null,
      topic: topicToPrompt(topic),
      title: title.trim(),
      content,
      ...(sourceSubmitId ? { sourceSubmitId } : {}),
    }
  }

  const applySaveResult = (result: DraftSaveResult, createdNew = false) => {
    preserveWritingSessionRef.current = true
    assignDraftMeta(result.id, result.updatedAt)
    lastAutoSavedHashRef.current = `${title}||${content}`
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
    setTopic(EMPTY_TOPIC)
    assignDraftMeta(undefined, undefined)
    assignIterateFrom(undefined)
    setSubmittedSnapshot(null)
    setIterateBaselineSnapshot(null)
    setWordCount(undefined)
    setWordLimit(undefined)
    lastAutoSavedHashRef.current = ''
    setEditorKey((key) => key + 1)
    setFeedback({ tone: 'info', message: '已开始新写作，请先获取题目' })

    try {
      localStorage.removeItem(localStorageKey)
    } catch { /* ignore */ }

    if (draftIdParam || iterateFromParam) {
      navigate('/writing', { replace: true })
    }
  }

  const handleRewrite = async () => {
    const hasContent = title.trim().length > 0 || !isEditorEmpty(content)
    const hasBoundDraft = Boolean(draftIdRef.current || iterateFromId)
    if (hasContent || hasBoundDraft || hasTopic) {
      const confirmed = await confirm({
        title: '确认重写',
        message: (
          <>
            <p>将清空标题、正文，并解除当前题目与草稿绑定。</p>
            <p className="mt-2">请重新获取题目后再写；当前草稿仍保留在写作记录中。</p>
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

    if (!hasTopic) {
      setFeedback({ tone: 'error', message: '请先获取题目再保存' })
      return
    }

    if (isEditorEmpty(content)) {
      setFeedback({ tone: 'error', message: '请先输入正文再保存' })
      return
    }

    setIsSaving(true)
    setFeedback(null)

    const payload = buildSavePayload()

    try {
      await enqueueDraftSave(async () => {
        const previousDraftId = draftIdRef.current
        try {
          const result = await saveWritingDraft(
            draftIdRef.current,
            payload,
            draftUpdatedAtRef.current,
          )
          const createdNew = Boolean(previousDraftId && previousDraftId !== result.id)
          applySaveResult(result, createdNew)
        } catch (err) {
          if (isApiError(err) && err.code === 409 && draftIdRef.current) {
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
                const result = await saveWritingDraft(draftIdRef.current, payload)
                applySaveResult(result)
              } catch (retryErr) {
                setFeedback({
                  tone: 'error',
                  message: retryErr instanceof Error ? retryErr.message : '覆盖保存失败',
                })
              }
              return
            }

            if (conflict) {
              setTitle(conflict.title)
              setContent(conflict.content)
              assignDraftMeta(draftIdRef.current, conflict.updatedAt)
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
        }
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!promptLogin()) return
    if (submitLockRef.current || isSubmitting) return

    if (!hasTopic) {
      setFeedback({ tone: 'error', message: '请先获取题目再提交' })
      return
    }

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
      const hasOwnKey = Boolean(settings.encryptedKey && settings.providerId && settings.modelId)
      const aiCheckEnabled = settings.postSubmitReview
      const aiStructureEnabled = settings.postSubmitStructure
      const aiSuggestionEnabled = settings.postSubmitSuggestions
      const hasAiTasks =
        (hasOwnKey || true) && // 免费通道始终可用（无 Key 时服务端自动选择）
        (aiCheckEnabled || aiStructureEnabled || aiSuggestionEnabled)

      let completedTasks: string[] = []
      let failedTasks: string[] = []
      let stageContents: Partial<Record<GradingStageKey, unknown>> = {}

      if (hasAiTasks) {
        setSubmitPhase('grading')
        const grading = await runPreSubmitGrading(content)
        completedTasks = grading.completedTasks
        failedTasks = grading.failedTasks
        stageContents = grading.stageContents
      }

      setSubmitPhase('submitting')

      const persistAiResults = async (submitId: string) => {
        if (!submitId || Object.keys(stageContents).length === 0) return
        saveGradingPreview(submitId, stageContents)
        try {
          await persistSubmitAiResults(submitId, stageContents, {
            providerId: hasOwnKey ? settings.providerId : 'free',
            modelId: hasOwnKey ? settings.modelId : 'free',
          })
        } catch (err) {
          console.warn('[StartWriting] AI 批改结果落库失败，已保留本机预览', err)
        }
      }

      if (iterateFromIdRef.current) {
        const sourceSubmitId = iterateFromIdRef.current
        const result = await iterateSubmit(sourceSubmitId, {
          title: title.trim(),
          content,
          draftId: draftIdRef.current,
          aiCheckEnabled,
          aiStructureEnabled,
          aiSuggestionEnabled,
        })

        await persistAiResults(result.id)
        assignDraftMeta(undefined, undefined)

        const aiSuccess =
          completedTasks.length > 0 ? ` 已完成 ${completedTasks.join('、')}。` : ''
        const aiFailed =
          failedTasks.length > 0 ? ` ${failedTasks.join('、')}未能完成。` : ''
        const aiViewHint =
          completedTasks.length > 0
            ? ' 可前往写作记录查看 AI 批改结果。'
            : ''
        const stats =
          result.wordCount !== undefined && result.wordLimit !== undefined
            ? `（${result.wordCount} / ${result.wordLimit} 词）`
            : ''

        assignIterateFrom(result.id)
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
        draftId: draftIdRef.current,
        aiCheckEnabled,
        aiStructureEnabled,
        aiSuggestionEnabled,
      })
      await persistAiResults(result.id)
      assignDraftMeta(undefined, undefined)
      setWordCount(undefined)
      setWordLimit(undefined)

      const aiSuccess =
        completedTasks.length > 0 ? ` 已完成 ${completedTasks.join('、')}。` : ''
      const aiFailed =
        failedTasks.length > 0 ? ` ${failedTasks.join('、')}未能完成。` : ''
      const aiViewHint =
        completedTasks.length > 0
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
    if (!hasTopic) return '请先获取题目'
    if (wordCount !== undefined && wordLimit !== undefined) {
      const mode = draftId ? '编辑中' : '新写作'
      return `${wordCount} / ${wordLimit} 词 · ${mode}`
    }
    if (iterateFromId) {
      if (isIterateUnchanged) return '相对最新版无变化 · 修改后可提交'
      return '迭代改进中 · 提交将创建新版本'
    }
    if (draftId) return '编辑中 · 题目已锁定 · 保存将更新当前草稿'
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
    'flex h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-xl border border-neutral-200 bg-white px-2 text-sm text-neutral-600 transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 active:scale-[0.97] sm:w-full sm:flex-none'

  // 手机：类型 + 换题横排；桌面：上换题 / 下类型，同宽竖排（收窄以对齐写作区右缘）
  const topicControls = (
    <div className="flex w-full shrink-0 items-center gap-2 self-start sm:w-[6.5rem] sm:flex-col sm:items-stretch sm:justify-center sm:gap-2 sm:self-stretch">
      <button
        type="button"
        onClick={() => void handleChangeTopic()}
        aria-disabled={topicLocked}
        className={`${changeTopicButtonClass} order-2 sm:order-1 ${topicLocked ? 'cursor-not-allowed opacity-45 hover:border-neutral-200 hover:bg-white hover:text-neutral-600 active:scale-100' : ''}`}
        title={topicLocked ? '当前草稿题目已锁定' : '换个题目'}
      >
        <RefreshCw size={14} className="shrink-0" />
        <span className="truncate">换个题目</span>
      </button>
      <div className={`relative order-1 sm:order-2 sm:w-full ${topicLocked ? 'cursor-not-allowed' : ''}`}>
        <TopicTypeSelect
          value={topicTypeFilter}
          onChange={handleTopicTypeFilterChange}
          disabled={topicLocked}
          rootClassName="sm:w-full"
          className="!px-2 sm:!w-full sm:!min-w-0"
        />
        {topicLocked && (
          <button
            type="button"
            className="absolute inset-0 z-10 rounded-lg"
            aria-label="题目类型已锁定"
            title="当前草稿题目已锁定"
            onClick={notifyTopicLocked}
          />
        )}
      </div>
    </div>
  )

  return (
    <div ref={pageRef} className="flex min-h-0 flex-1 overflow-hidden">
      {/* 题目 + 写作同列，避免写作辅助侧栏把两边 max-w-5xl 挤成不对齐 */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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
                {hasTopic ? (
                  <div
                    className={`h-full min-h-0 ${topicLocked ? 'cursor-default' : ''}`}
                    onClick={
                      topicLocked
                        ? (event) => {
                            if ((event.target as HTMLElement).closest('button')) return
                            notifyTopicLocked()
                          }
                        : undefined
                    }
                    onKeyDown={
                      topicLocked
                        ? (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              notifyTopicLocked()
                            }
                          }
                        : undefined
                    }
                    role={topicLocked ? 'button' : undefined}
                    tabIndex={topicLocked ? 0 : undefined}
                    title={topicLocked ? '当前草稿题目已锁定' : undefined}
                  >
                    <TopicPromptBox fill prompt={topicPrompt} type={topic.type || '题目'} />
                  </div>
                ) : (
                  <div className="flex h-full min-h-0 w-full items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50/80 px-3 py-2">
                    <p className="text-center text-sm text-neutral-400 sm:text-[15px]">请获取题目</p>
                  </div>
                )}
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

        <div
          ref={writingScrollRef}
          onScroll={handleWritingScroll}
          className={`writing-area-scroll mx-auto w-full min-w-0 max-w-5xl flex-1 overflow-x-hidden overflow-y-auto py-5 sm:py-8 ${MAIN_CONTENT_X_CLASS}`}
        >
          {writingFullscreen ? (
            <div className="flex min-h-full items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-white/60 px-4 py-16 text-sm text-neutral-400">
              写作区全屏中…
            </div>
          ) : (
            <div className="writing-sheet relative flex min-h-full flex-col rounded-xl border border-neutral-200/95 bg-gradient-to-b from-white/92 to-neutral-50/55 pb-12 shadow-[inset_0_1px_0_rgb(255_255_255/0.8)]">
              <div className="shrink-0 border-b border-neutral-100 px-4 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="自定义标题"
                  className="w-full border-none bg-transparent text-center text-xl font-semibold text-neutral-900 outline-none placeholder:text-neutral-300 sm:text-2xl"
                />
              </div>

              <NotionEditor key={editorKey} content={content} onChange={setContent} />

              <button
                type="button"
                onClick={() => setWritingFullscreen(true)}
                className="absolute bottom-3 right-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white/95 text-neutral-500 shadow-sm transition-colors hover:bg-neutral-50 hover:text-neutral-800 active:scale-95"
                title="全屏写作"
                aria-label="全屏写作"
              >
                <Maximize2 size={16} strokeWidth={1.75} />
              </button>
            </div>
          )}
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
                title={topicLocked ? '清空并解除题目绑定，请重新获取题目' : '清空标题和正文，下次保存创建新草稿'}
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

      {writingFullscreen
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex flex-col bg-neutral-100"
              role="dialog"
              aria-modal="true"
              aria-label="全屏写作"
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 sm:px-6">
                <div className="min-w-0">
                  <p className="font-sans text-sm font-semibold text-neutral-900">专注写作</p>
                  <p className="mt-0.5 truncate text-xs text-neutral-400">
                    {topicPrompt || '写作区全屏 · Esc 退出'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWritingFullscreen(false)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
                >
                  <X size={14} strokeWidth={1.75} />
                  退出全屏
                </button>
              </div>
              <div className="writing-fullscreen-scroll min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
                <div className="writing-sheet mx-auto flex min-h-full max-w-5xl flex-col rounded-xl border border-neutral-200/95 bg-gradient-to-b from-white to-neutral-50/80 shadow-sm">
                  <div className="shrink-0 border-b border-neutral-100 px-4 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="自定义标题"
                      className="w-full border-none bg-transparent text-center text-xl font-semibold text-neutral-900 outline-none placeholder:text-neutral-300 sm:text-2xl"
                    />
                  </div>
                  <NotionEditor key={`fs-${editorKey}`} content={content} onChange={setContent} />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <WritingAssistPanel />

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
