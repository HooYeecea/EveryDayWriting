import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart3, Check, ClipboardList, Clock, FileText, Lightbulb, LogIn, PenLine, RotateCcw, Sparkles, Wand2, AlertTriangle } from 'lucide-react'
import {
  deleteDraft,
  deleteSubmit,
  getDrafts,
  getSubmittedWritingById,
  getSubmittedWritings,
  loadDraftById,
} from '../../api/writing'
import { SuggestionChatBox } from '../writing/SuggestionChatBox'
import { AiMarkdownContent } from '../writing/AiMarkdownContent'
import { SubmitVersionNav } from '../writing/SubmitVersionNav'
import { VocabularySelectionAdd } from '../vocabulary/VocabularySelectionAdd'
import { useAuth } from '../../context/AuthContext'
import { useAppAlert } from '../../context/AppAlertContext'
import { useAppConfirm } from '../../context/AppConfirmContext'
import { loadGradingPreview } from '../../storage/gradingPreviewStorage'
import { groupSubmitListItems, type GroupedSubmitListItem } from '../../utils/submitListGrouper'
import type {
  GrammarCheckResult,
  GrammarErrorItem,
  IterationSibling,
  StructureResult,
  VocabSuggestionItem,
  VocabularyCheckResult,
  WritingDraft,
  WritingDraftListItem,
  WritingSubmitDetail,
} from '../../types'
import {
  MAIN_CONTENT_X_CLASS,
  PANEL_HEADER_CLASS,
  PANEL_HEADER_ROW_CLASS,
  PANEL_TITLE_CLASS,
  SIDE_PANEL_WIDTH_CLASS,
} from '../layout/layoutConstants'
import {
  DEFAULT_RECORD_SEARCH_FIELDS,
  filterSubmitsBySearchFields,
  needsServerKeyword,
  type RecordSearchField,
  WritingRecordsSearchBar,
} from '../writing/WritingRecordsSearchBar'

type RecordTab = 'saves' | 'submits'

type RecordsLocationState = {
  tab?: RecordTab
  selectedId?: string
}

function formatTime(time: string) {
  return new Date(time).toLocaleString()
}

/** 判断是否为结构化对象（非字符串） */
function isStructured<T>(value: unknown): value is T {
  return value !== null && value !== undefined && typeof value !== 'string'
}

/** 兼容 AI 返回的逐段点评字段名差异 */
function normalizeParagraphFb(raw: unknown): { index: number; text: string } | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>
  const index =
    Number(item.paragraphIndex ?? item.ParagraphIndex ?? item.index ?? item.Index ?? -1)
  if (index < 0 || !Number.isFinite(index)) return null
  const text =
    (typeof item.feedback === 'string' && item.feedback) ||
    (typeof item.Feedback === 'string' && item.Feedback) ||
    (typeof item.comment === 'string' && item.comment) ||
    (typeof item.Comment === 'string' && item.Comment) ||
    (typeof item.text === 'string' && item.text) ||
    ''
  if (!text) return null
  return { index: index + 1, text } // 后端 0-based → 显示 1-based
}

/** 从 grading preview 中提取 grammar 结构化数据 */
function extractGrammarPreview(preview: ReturnType<typeof loadGradingPreview>): GrammarCheckResult | null {
  if (!preview?.grammar) return null
  if (isStructured<GrammarCheckResult>(preview.grammar)) return preview.grammar
  return null
}

/** 从 grading preview 中提取 vocabulary 结构化数据 */
function extractVocabPreview(preview: ReturnType<typeof loadGradingPreview>): VocabularyCheckResult | null {
  if (!preview?.vocabulary) return null
  if (isStructured<VocabularyCheckResult>(preview.vocabulary)) return preview.vocabulary
  return null
}

/** 从 grading preview 中提取 structure 结构化数据 */
function extractStructurePreview(preview: ReturnType<typeof loadGradingPreview>): StructureResult | null {
  if (!preview?.structure) return null
  if (isStructured<StructureResult>(preview.structure)) return preview.structure
  return null
}

/** 从 grading preview 中提取旧版 markdown 字符串（兼容） */
function extractProsePreview(preview: ReturnType<typeof loadGradingPreview>, key: 'grammar' | 'structure' | 'vocabulary'): string | null {
  const value = preview?.[key]
  if (typeof value === 'string' && value.trim()) return value.trim()
  return null
}

function resolveVersionList(
  detail: WritingSubmitDetail | null,
  group: GroupedSubmitListItem | undefined,
): IterationSibling[] {
  const apiVersions =
    detail?.iterations && detail.iterations.length > 0
      ? [...detail.iterations].sort((a, b) => a.iterationNumber - b.iterationNumber)
      : []
  const apiById = new Map(apiVersions.map((item) => [item.id, item]))

  const enrichVersion = (version: IterationSibling): IterationSibling => {
    const fromApi = apiById.get(version.id)
    if (fromApi) return fromApi
    if (detail && version.id === detail.id) {
      return {
        id: detail.id,
        iterationNumber: detail.iterationNumber ?? version.iterationNumber,
        aiScore: detail.aiScore,
        submittedAt: detail.submittedAt,
      }
    }
    return version
  }

  // 列表侧版本链通常比详情 iterations 更完整，优先采用
  if (group && group.versionCount > 1) {
    const baseVersions =
      group.allVersions.length > 0
        ? group.allVersions
        : group.allVersionIds.map((id, index) => ({
            id,
            iterationNumber: index + 1,
            aiScore: id === group.id ? group.aiScore : null,
            submittedAt: group.submittedAt,
          }))

    const merged = baseVersions.map(enrichVersion)
    if (detail && !merged.some((item) => item.id === detail.id)) {
      merged.push({
        id: detail.id,
        iterationNumber: detail.iterationNumber ?? merged.length + 1,
        aiScore: detail.aiScore,
        submittedAt: detail.submittedAt,
      })
      merged.sort((a, b) => a.iterationNumber - b.iterationNumber)
    }
    return merged
  }

  if (apiVersions.length > 1) {
    return apiVersions
  }

  if (apiVersions.length === 1) {
    return apiVersions
  }

  if (detail) {
    return [
      {
        id: detail.id,
        iterationNumber: detail.iterationNumber ?? 1,
        aiScore: detail.aiScore,
        submittedAt: detail.submittedAt,
      },
    ]
  }

  return []
}

export function WritingRecords() {
  const { user, isAuthenticated } = useAuth()
  const { alert } = useAppAlert()
  const { confirm } = useAppConfirm()
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = (location.state as RecordsLocationState | null) ?? null
  const [tab, setTab] = useState<RecordTab>(locationState?.tab ?? 'saves')
  const [saves, setSaves] = useState<WritingDraftListItem[]>([])
  const [submits, setSubmits] = useState<GroupedSubmitListItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(locationState?.selectedId ?? null)
  const [submitDetail, setSubmitDetail] = useState<WritingSubmitDetail | null>(null)
  const [_submitDetailLoading, setSubmitDetailLoading] = useState(false)
  const [selectedDraft, setSelectedDraft] = useState<WritingDraftListItem | null>(null)
  const [draftDetail, setDraftDetail] = useState<WritingDraft | null>(null)
  const [draftDetailLoading, setDraftDetailLoading] = useState(false)
  const [savesLoading, setSavesLoading] = useState(false)
  const [submitsLoading, setSubmitsLoading] = useState(false)
  const [mobileShowDetail, setMobileShowDetail] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [activeKeyword, setActiveKeyword] = useState('')
  const [searchFields, setSearchFields] = useState<RecordSearchField[]>(
    DEFAULT_RECORD_SEARCH_FIELDS,
  )

  const [deleting, setDeleting] = useState(false)
  const draftDetailScrollRef = useRef<HTMLDivElement | null>(null)
  const submitDetailScrollRef = useRef<HTMLDivElement | null>(null)
  const draftShellRef = useRef<HTMLDivElement | null>(null)
  const submitShellRef = useRef<HTMLDivElement | null>(null)
  const detailRequestIdRef = useRef(0)
  const draftHeightUnlockRef = useRef<number | null>(null)
  const submitHeightUnlockRef = useRef<number | null>(null)
  const [draftSwitching, setDraftSwitching] = useState(false)
  const [submitSwitching, setSubmitSwitching] = useState(false)
  const [draftShellMinH, setDraftShellMinH] = useState<number | undefined>()
  const [submitShellMinH, setSubmitShellMinH] = useState<number | undefined>()

  const selectRecord = (id: string) => {
    setSelectedId(id)
    setMobileShowDetail(true)
  }

  const selectTab = (next: RecordTab) => {
    if (next === tab) return
    setTab(next)
    setSelectedId(null)
    setMobileShowDetail(false)
  }

  const lockShellHeight = (
    shell: HTMLDivElement | null,
    setMinH: (h: number | undefined) => void,
  ) => {
    if (!shell) return
    const height = shell.offsetHeight
    if (height > 0) setMinH(height)
  }

  const unlockShellHeightSoon = (
    timerRef: { current: number | null },
    setMinH: (h: number | undefined) => void,
  ) => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      setMinH(undefined)
      timerRef.current = null
    }, 360)
  }

  useEffect(() => {
    const state = location.state as RecordsLocationState | null
    if (!state?.selectedId) return
    setSelectedId(state.selectedId)
    setMobileShowDetail(true)
    if (state.tab) {
      setTab(state.tab)
    }
  }, [location.state])

  const selectedSubmitGroup = submits.find(
    (item) => item.id === selectedId || item.allVersionIds.includes(selectedId ?? ''),
  )

  const handleDelete = async () => {
    if (!selectedId || deleting) return
    const label = tab === 'saves' ? '草稿' : '提交记录'
    const ok = await confirm({
      title: `删除${label}`,
      message: `确定删除这条${label}？此操作不可恢复。`,
      confirmLabel: '删除',
      variant: 'warning',
    })
    if (!ok) return

    setDeleting(true)
    try {
      if (tab === 'saves') {
        await deleteDraft(selectedId)
        setSaves((prev) => prev.filter((item) => item.id !== selectedId))
      } else {
        await deleteSubmit(selectedId)
        const result = await getSubmittedWritings({
          keyword: needsServerKeyword(activeKeyword, searchFields)
            ? activeKeyword
            : undefined,
          page: 1,
          pageSize: 100,
        })
        const filtered = filterSubmitsBySearchFields(
          result.items,
          activeKeyword,
          searchFields,
        )
        setSubmits(groupSubmitListItems(filtered))
      }
      setSelectedId(null)
      setMobileShowDetail(false)
    } catch (err) {
      void alert({
        title: '删除失败',
        message: err instanceof Error ? err.message : '删除失败',
        variant: 'notice',
      })
    } finally {
      setDeleting(false)
    }
  }

  const toggleSearchField = (field: RecordSearchField) => {
    setSearchFields((prev) => {
      if (prev.includes(field)) {
        if (prev.length <= 1) return prev
        return prev.filter((item) => item !== field)
      }
      return [...prev, field]
    })
  }

  const searchBarProps = {
    tab,
    keyword: searchKeyword,
    onKeywordChange: setSearchKeyword,
    fields: searchFields,
    onToggleField: toggleSearchField,
    onReset: () => {
      setSearchKeyword('')
      setActiveKeyword('')
      setSearchFields([...DEFAULT_RECORD_SEARCH_FIELDS])
    },
    onSearch: () => {
      if (tab === 'submits') {
        setActiveKeyword(searchKeyword.trim())
      }
    },
    searchEnabled: tab === 'submits',
  }

  useEffect(() => {
    setSearchKeyword('')
    setActiveKeyword('')
    setSearchFields([...DEFAULT_RECORD_SEARCH_FIELDS])
  }, [tab])

  useEffect(() => {
    if (!isAuthenticated) return

    setSavesLoading(true)
    getDrafts(1, 100)
      .then((result) => setSaves(result.items))
      .finally(() => setSavesLoading(false))
  }, [isAuthenticated, location.key])

  useEffect(() => {
    if (!isAuthenticated) return

    setSubmitsLoading(true)
    getSubmittedWritings({
      keyword: needsServerKeyword(activeKeyword, searchFields)
        ? activeKeyword
        : undefined,
      page: 1,
      pageSize: 100,
    })
      .then((result) => {
        const filtered = filterSubmitsBySearchFields(
          result.items,
          activeKeyword,
          searchFields,
        )
        setSubmits(groupSubmitListItems(filtered))
      })
      .finally(() => setSubmitsLoading(false))
  }, [isAuthenticated, activeKeyword, searchFields, location.key])

  useEffect(() => {
    if (!selectedId) {
      setSubmitDetail(null)
      setSubmitDetailLoading(false)
      setSelectedDraft(null)
      setDraftDetail(null)
      setDraftDetailLoading(false)
      setDraftSwitching(false)
      setSubmitSwitching(false)
      setDraftShellMinH(undefined)
      setSubmitShellMinH(undefined)
      return
    }

    const requestId = ++detailRequestIdRef.current

    if (tab === 'saves') {
      setSubmitDetail(null)
      setSubmitDetailLoading(false)
      setSubmitSwitching(false)
      const draft = saves.find((item) => item.id === selectedId) ?? null
      setSelectedDraft(draft)
      if (!draft) {
        setDraftDetail(null)
        setDraftDetailLoading(false)
        setDraftSwitching(false)
        return
      }

      // 已是当前详情：不重拉，避免列表刷新时误触发软切换
      if (draftDetail?.id === draft.id) {
        setDraftDetailLoading(false)
        setDraftSwitching(false)
        return
      }

      lockShellHeight(draftShellRef.current, setDraftShellMinH)
      const draftScroller = draftDetailScrollRef.current
      if (draftScroller && draftScroller.scrollTop !== 0) draftScroller.scrollTop = 0
      setDraftSwitching(true)
      setDraftDetailLoading(true)
      loadDraftById(draft.id)
        .then((detail) => {
          if (requestId !== detailRequestIdRef.current) return
          setDraftDetail(detail)
        })
        .catch(() => {
          if (requestId !== detailRequestIdRef.current) return
          setDraftDetail((prev) => prev ?? null)
        })
        .finally(() => {
          if (requestId === detailRequestIdRef.current) {
            setDraftDetailLoading(false)
            setDraftSwitching(false)
            unlockShellHeightSoon(draftHeightUnlockRef, setDraftShellMinH)
          }
        })
      return
    }

    setSelectedDraft(null)
    setDraftDetail(null)
    setDraftDetailLoading(false)
    setDraftSwitching(false)

    if (submitDetail?.id === selectedId) {
      setSubmitDetailLoading(false)
      setSubmitSwitching(false)
      return
    }

    lockShellHeight(submitShellRef.current, setSubmitShellMinH)
    const submitScroller = submitDetailScrollRef.current
    if (submitScroller && submitScroller.scrollTop !== 0) submitScroller.scrollTop = 0
    setSubmitSwitching(true)
    setSubmitDetailLoading(true)
    getSubmittedWritingById(selectedId)
      .then((detail) => {
        if (requestId !== detailRequestIdRef.current) return
        setSubmitDetail(detail)
      })
      .catch(() => {
        if (requestId !== detailRequestIdRef.current) return
        setSubmitDetail((prev) => prev ?? null)
      })
      .finally(() => {
        if (requestId === detailRequestIdRef.current) {
          setSubmitDetailLoading(false)
          setSubmitSwitching(false)
          unlockShellHeightSoon(submitHeightUnlockRef, setSubmitShellMinH)
        }
      })
    // draftDetail/submitDetail 仅用于跳过重复请求，不列入 deps，避免替换内容后反复触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, tab, saves])

  useEffect(() => {
    return () => {
      if (draftHeightUnlockRef.current != null) {
        window.clearTimeout(draftHeightUnlockRef.current)
      }
      if (submitHeightUnlockRef.current != null) {
        window.clearTimeout(submitHeightUnlockRef.current)
      }
    }
  }, [])

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
          <LogIn size={28} className="text-neutral-400" strokeWidth={1.5} />
        </div>
        <h2 className="mt-5 text-lg font-medium text-neutral-800">登录后查看写作记录</h2>
        <p className="mt-2 max-w-sm text-center text-sm text-neutral-400">
          登录后可查看草稿与正式提交记录
        </p>
        <Link
          to="/login"
          state={{ from: '/records' }}
          className="mt-6 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          立即登录
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div
        className={`flex w-full shrink-0 flex-col border-r border-neutral-200 bg-white md:w-56 ${SIDE_PANEL_WIDTH_CLASS} ${
          mobileShowDetail ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <div className={PANEL_HEADER_CLASS}>
          <div className={PANEL_HEADER_ROW_CLASS}>
            <div className="min-w-0">
              <h2 className={`${PANEL_TITLE_CLASS} flex items-center gap-2`}>
                <ClipboardList size={18} strokeWidth={2} className="shrink-0 text-neutral-800" />
                写作记录
              </h2>
            </div>
          </div>
        </div>

        <div className="flex gap-1 border-b border-neutral-200 p-2">
          <button
            type="button"
            onClick={() => selectTab('saves')}
            className={`flex-1 rounded-lg py-2 text-xs transition-colors sm:text-sm md:text-xs ${
              tab === 'saves'
                ? 'bg-neutral-900 font-medium text-white'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            草稿
          </button>
          <button
            type="button"
            onClick={() => selectTab('submits')}
            className={`flex-1 rounded-lg py-2 text-xs transition-colors sm:text-sm md:text-xs ${
              tab === 'submits'
                ? 'bg-neutral-900 font-medium text-white'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            提交记录
          </button>
        </div>

        <div className="records-list-viewport flex min-h-0 flex-1 flex-col">
          <div className="records-list-track" data-active={tab}>
            <div className="records-list-pane">
              <div className="flex-1 overflow-y-auto p-2 [scrollbar-gutter:stable]">
                {savesLoading && saves.length === 0 && (
                  <p className="px-3 py-4 text-sm text-neutral-400">加载中…</p>
                )}
                {!savesLoading && saves.length === 0 && (
                  <p className="py-8 text-center text-sm text-neutral-400">暂无草稿</p>
                )}
                {saves.map((record) => (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => selectRecord(record.id)}
                    className={`mb-0.5 w-full rounded-r-lg border-l-2 py-2.5 pl-3 pr-3 text-left transition-colors duration-150 ${
                      tab === 'saves' && selectedId === record.id
                        ? 'border-l-neutral-900 bg-neutral-100'
                        : 'border-l-transparent hover:bg-neutral-50'
                    }`}
                  >
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {record.title || '无标题'}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-400">
                      <Clock size={11} />
                      {formatTime(record.updatedAt)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="records-list-pane">
              <div className="shrink-0 border-b border-neutral-200 lg:hidden">
                <WritingRecordsSearchBar {...searchBarProps} compact searchEnabled />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-gutter:stable]">
                {submitsLoading && submits.length === 0 && (
                  <p className="px-3 py-4 text-sm text-neutral-400">加载中…</p>
                )}
                {!submitsLoading && submits.length === 0 && (
                  <p className="py-8 text-center text-sm text-neutral-400">暂无提交记录</p>
                )}
                {submits.map((record) => (
                  <button
                    key={record.iterationGroupId ?? record.id}
                    type="button"
                    onClick={() => selectRecord(record.id)}
                    className={`mb-0.5 w-full rounded-r-lg border-l-2 py-2.5 pl-3 pr-3 text-left transition-colors duration-150 ${
                      tab === 'submits' &&
                      (selectedSubmitGroup?.id === record.id ||
                        record.allVersionIds.includes(selectedId ?? ''))
                        ? 'border-l-neutral-900 bg-neutral-100'
                        : 'border-l-transparent hover:bg-neutral-50'
                    }`}
                  >
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {record.title || '无标题'}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] text-neutral-400">{record.topicType}</span>
                      <span className="flex shrink-0 items-center gap-1.5 text-[11px]">
                        {record.aiScore !== null && (
                          <span className="font-medium text-neutral-600">{record.aiScore} 分</span>
                        )}
                        {record.versionCount > 1 && (
                          <span className="rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
                            {record.versionCount} 版
                          </span>
                        )}
                        {record.iterationNumber != null && record.versionCount <= 1 && (
                          <span className="text-neutral-400">v{record.iterationNumber}</span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-400">
                      <Clock size={11} />
                      {formatTime(record.submittedAt)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`flex min-w-0 flex-1 flex-col overflow-hidden bg-[#fafafa] ${
          mobileShowDetail ? 'flex' : 'hidden lg:flex'
        }`}
      >
        <div className="records-list-viewport flex min-h-0 flex-1 flex-col">
          <div className="records-list-track" data-active={tab}>
            <div className="records-list-pane">
              <div
                ref={draftDetailScrollRef}
                className={`records-detail-scroller flex-1 overflow-y-auto py-5 sm:py-8 ${MAIN_CONTENT_X_CLASS}`}
              >
                {mobileShowDetail && (
                  <button
                    type="button"
                    onClick={() => setMobileShowDetail(false)}
                    className="mb-4 flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 lg:hidden"
                  >
                    <ArrowLeft size={16} />
                    返回列表
                  </button>
                )}

                {!selectedId && (
                  <div className="records-empty-enter flex h-full min-h-[12rem] flex-col items-center justify-center text-neutral-400">
                    <FileText size={32} strokeWidth={1.5} />
                    <p className="mt-3 text-sm">选择一条记录查看详情</p>
                  </div>
                )}

                {selectedDraft && (
                  <div
                    ref={draftShellRef}
                    className="records-detail-shell mx-auto max-w-3xl"
                    data-switching={
                      draftSwitching || (draftDetail != null && draftDetail.id !== selectedDraft.id)
                    }
                    style={draftShellMinH != null ? { minHeight: draftShellMinH } : undefined}
                  >
                    {draftDetail ? (
                      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-500">
                              草稿
                            </span>
                            <h3 className="mt-3 text-lg font-semibold text-neutral-900 sm:text-xl">
                              {(saves.find((item) => item.id === draftDetail.id) ?? selectedDraft)
                                .title || '无标题'}
                            </h3>
                          </div>
                          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                            <button
                              type="button"
                              onClick={() => {
                                navigate(`/writing?draftId=${draftDetail.id}`)
                              }}
                              disabled={draftDetail.id !== selectedDraft.id}
                              className="flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                            >
                              <PenLine size={14} />
                              继续编辑
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete()}
                              disabled={deleting || draftDetail.id !== selectedDraft.id}
                              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 disabled:opacity-50"
                            >
                              {deleting ? '删除中…' : '删除草稿'}
                            </button>
                          </div>
                        </div>
                        <dl className="mt-6 space-y-3 border-t border-neutral-100 pt-5 text-sm">
                          <div>
                            <dt className="text-neutral-400">最后更新</dt>
                            <dd className="mt-0.5 text-neutral-700">
                              {formatTime(
                                (saves.find((item) => item.id === draftDetail.id) ?? selectedDraft)
                                  .updatedAt,
                              )}
                            </dd>
                          </div>
                        </dl>
                        <div className="mt-4">
                          <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                            <h4 className="text-sm font-medium text-neutral-500">正文预览</h4>
                            <div
                              className="notion-editor mt-3 text-sm text-neutral-800"
                              dangerouslySetInnerHTML={{
                                __html: draftDetail.content || '<p></p>',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
                        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-500">
                          草稿
                        </span>
                        <h3 className="mt-3 text-lg font-semibold text-neutral-900 sm:text-xl">
                          {selectedDraft.title || '无标题'}
                        </h3>
                        <div className="mt-4 min-h-[12rem]">
                          <p className="text-sm text-neutral-400">
                            {draftDetailLoading ? '加载草稿内容…' : '未能加载该草稿'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="records-list-pane">
              <div className="hidden shrink-0 border-b border-neutral-200 lg:block">
                <WritingRecordsSearchBar {...searchBarProps} searchEnabled />
              </div>
              <div
                ref={submitDetailScrollRef}
                className={`records-detail-scroller min-h-0 flex-1 overflow-y-auto py-5 sm:py-8 ${MAIN_CONTENT_X_CLASS}`}
              >
                {mobileShowDetail && (
                  <button
                    type="button"
                    onClick={() => setMobileShowDetail(false)}
                    className="mb-4 flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 lg:hidden"
                  >
                    <ArrowLeft size={16} />
                    返回列表
                  </button>
                )}

                {!selectedId && (
                  <div className="records-empty-enter flex h-full min-h-[12rem] flex-col items-center justify-center text-neutral-400">
                    <FileText size={32} strokeWidth={1.5} />
                    <p className="mt-3 text-sm">选择一条记录查看详情</p>
                  </div>
                )}

                {selectedId && (
                  <div
                    ref={submitShellRef}
                    className="records-detail-shell mx-auto max-w-3xl"
                    data-switching={
                      submitSwitching ||
                      (submitDetail != null && submitDetail.id !== selectedId)
                    }
                    style={submitShellMinH != null ? { minHeight: submitShellMinH } : undefined}
                  >
                    {!submitDetail ? (
                      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
                        <div className="min-h-[12rem]">
                          <p className="text-sm text-neutral-400">
                            {_submitDetailLoading ? '加载记录详情…' : '未能加载该记录'}
                          </p>
                        </div>
                      </div>
                    ) : (() => {
            const gradingPreview = loadGradingPreview(submitDetail.id)
            const grammarSuggestions = submitDetail.grammarSuggestions ?? []
            const vocabularySuggestions = submitDetail.vocabularySuggestions ?? []

            // 新版结构化数据（grading preview 优先，兼容旧版 markdown）
            const grammarPreview = extractGrammarPreview(gradingPreview)
            const vocabPreview = extractVocabPreview(gradingPreview)
            const structurePreview = extractStructurePreview(gradingPreview)

            if (import.meta.env.DEV) {
              console.debug('[WritingRecords] gradingPreview keys:', gradingPreview ? Object.keys(gradingPreview) : 'null')
              console.debug('[WritingRecords] structurePreview:', structurePreview ? '有数据' : 'null')
            }

            // 旧版 markdown 兼容
            const grammarProse = extractProsePreview(gradingPreview, 'grammar')
            const vocabProse = extractProsePreview(gradingPreview, 'vocabulary')
            const evaluationProse =
              submitDetail.aiEvaluation?.trim() ||
              extractProsePreview(gradingPreview, 'structure')

            // 合并结构化 + 后端已解析的建议
            const mergedGrammarErrors: GrammarErrorItem[] = [
              ...(grammarPreview?.errors ?? []),
              ...grammarSuggestions.map((s) => ({ id: s.id, original: s.original, correction: s.correction, reason: s.reason })),
            ]
            const mergedVocabSuggestions: VocabSuggestionItem[] = [
              ...(vocabPreview?.suggestions ?? []),
              ...vocabularySuggestions.map((s) => ({ id: s.id, original: s.original, suggestion: s.suggestion, context: s.context })),
            ]

            const versions = resolveVersionList(submitDetail, selectedSubmitGroup)
            const latestVersionId =
              versions.length > 0 ? versions[versions.length - 1].id : submitDetail.id
            const isLatestVersion = submitDetail.id === latestVersionId
            const detailReady = submitDetail.id === selectedId

            const hasAnyAiResult =
              !!grammarPreview ||
              mergedGrammarErrors.length > 0 ||
              !!grammarProse ||
              !!structurePreview ||
              !!evaluationProse ||
              !!vocabPreview ||
              mergedVocabSuggestions.length > 0 ||
              !!vocabProse

            return (
              <>
              <SubmitVersionNav
                versions={versions}
                currentId={submitDetail.id}
                onChange={(id) => {
                  if (id === selectedId) return
                  selectRecord(id)
                }}
              >
              <VocabularySelectionAdd>
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="min-w-0">
                  <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-500">
                    提交记录
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-neutral-900 sm:text-xl">
                    {submitDetail.title || '无标题'}
                  </h3>
                  {submitDetail.aiScore !== null && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-600">
                      <Sparkles size={14} />
                      AI 评分：{submitDetail.aiScore}
                      {submitDetail.iterationNumber != null && (
                        <span className="text-neutral-400">· 第 {submitDetail.iterationNumber} 版</span>
                      )}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/writing?iterateFrom=${latestVersionId}`)}
                      disabled={!detailReady || !isLatestVersion}
                      title={!isLatestVersion ? '请基于最新版继续修改' : undefined}
                      className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RotateCcw size={14} />
                      继续修改
                    </button>
                    {!isLatestVersion && (
                      <span className="text-xs text-neutral-400">请基于最新版继续修改</span>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      disabled={deleting || !detailReady}
                      className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 disabled:opacity-50"
                    >
                      {deleting ? '删除中…' : '删除记录'}
                    </button>
                  </div>
                </div>

                <dl className="mt-6 space-y-3 border-t border-neutral-100 pt-5 text-sm">
                  <div>
                    <dt className="text-neutral-400">题目</dt>
                    <dd className="mt-0.5 leading-relaxed text-neutral-800">{submitDetail.topic}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-400">题目类型</dt>
                    <dd className="mt-0.5 text-neutral-700">{submitDetail.topicType}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-400">提交时间</dt>
                    <dd className="mt-0.5 text-neutral-700">{formatTime(submitDetail.submittedAt)}</dd>
                  </div>
                  {submitDetail.aiEvaluation && (
                    <div>
                      <dt className="text-neutral-400">总评</dt>
                      <dd className="mt-0.5 leading-relaxed text-neutral-700">
                        {submitDetail.aiEvaluation}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:mt-6 sm:p-6">
                <h4 className="text-sm font-medium text-neutral-500">正文内容</h4>
                <div
                  className="notion-editor mt-4 text-neutral-800"
                  dangerouslySetInnerHTML={{ __html: submitDetail.content || '<p></p>' }}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:mt-6 sm:p-6">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-neutral-400" />
                  <h4 className="text-sm font-medium text-neutral-700">AI 批改结果</h4>
                </div>

                {/* ── 结构与评分（新版 structure） ── */}
                {structurePreview && (
                  <div className="mt-4">
                    <div className="flex items-center gap-1.5 border-b border-neutral-100 pb-2">
                      <BarChart3 size={14} className="text-neutral-400" />
                      <h5 className="text-[13px] font-medium text-neutral-700">结构与评分</h5>
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500">
                        IELTS 9分制
                      </span>
                    </div>

                    {/* 总分 */}
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-white">
                        <span className="text-2xl font-bold">{structurePreview.score}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-neutral-400">综合评分</p>
                        <p className="text-[11px] text-neutral-400">满分 9.0</p>
                      </div>
                    </div>

                    {/* 四项子评分 */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {([
                        { key: 'taskResponse' as const, label: '任务回应' },
                        { key: 'coherenceCohesion' as const, label: '连贯与衔接' },
                        { key: 'lexicalResource' as const, label: '词汇资源' },
                        { key: 'grammaticalRange' as const, label: '语法范围' },
                      ]).map(({ key, label }) => (
                        <div key={key} className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
                          <p className="text-[10px] text-neutral-400">{label}</p>
                          <p className="mt-0.5 text-lg font-semibold text-neutral-800">
                            {structurePreview.subScores[key]}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* 优势 & 不足 */}
                    {structurePreview.overall.strengths.length > 0 && (
                      <div className="mt-4">
                        <p className="flex items-center gap-1.5 text-xs font-medium text-green-700">
                          <Check size={12} /> 优势
                        </p>
                        <ul className="mt-1.5 space-y-1">
                          {structurePreview.overall.strengths.map((item, i) => (
                            <li key={`str-${i}`} className="flex items-start gap-1.5 text-sm text-neutral-700">
                              <Check size={12} className="mt-0.5 shrink-0 text-green-500" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {structurePreview.overall.weaknesses.length > 0 && (
                      <div className="mt-3">
                        <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                          <AlertTriangle size={12} /> 待改进
                        </p>
                        <ul className="mt-1.5 space-y-1">
                          {structurePreview.overall.weaknesses.map((item, i) => (
                            <li key={`wk-${i}`} className="flex items-start gap-1.5 text-sm text-neutral-700">
                              <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-500" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 总评摘要 */}
                    {structurePreview.overall.summary && (
                      <div className="mt-4 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5">
                        <p className="text-xs font-medium text-neutral-500">总体评价</p>
                        <p className="mt-1.5 text-sm leading-relaxed text-neutral-700">
                          {structurePreview.overall.summary}
                        </p>
                      </div>
                    )}

                    {/* 逐段点评 */}
                    {(() => {
                      const pbs = structurePreview.paragraphFeedback
                        .map(normalizeParagraphFb)
                        .filter((v): v is NonNullable<typeof v> => v !== null)
                      if (pbs.length === 0) return null
                      return (
                        <div className="mt-4">
                          <p className="text-xs font-medium text-neutral-500">逐段点评</p>
                          <div className="mt-2 space-y-2">
                            {pbs.map((fb) => (
                              <div
                                key={fb.index}
                                className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2"
                              >
                                <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
                                  第 {fb.index} 段
                                </span>
                                <p className="mt-1.5 text-sm leading-relaxed text-neutral-700">
                                  {fb.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* 兼容旧版 structure/evaluation prose */}
                {!structurePreview && evaluationProse && (
                  <div className="mt-4">
                    <div className="flex items-center gap-1.5 border-b border-neutral-100 pb-2">
                      <Lightbulb size={14} className="text-neutral-400" />
                      <h5 className="text-[13px] font-medium text-neutral-700">提升建议</h5>
                    </div>
                    <AiMarkdownContent content={evaluationProse} className="mt-2" />
                  </div>
                )}

                {/* ── 语法检查 ── */}
                {(grammarPreview || mergedGrammarErrors.length > 0 || grammarProse) && (
                  <div className="mt-4">
                    <div className="flex items-center gap-1.5 border-b border-neutral-100 pb-2">
                      <Wand2 size={14} className="text-neutral-400" />
                      <h5 className="text-[13px] font-medium text-neutral-700">检查与修改</h5>
                      {mergedGrammarErrors.length > 0 && (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500">
                          {mergedGrammarErrors.length} 条
                        </span>
                      )}
                    </div>
                    {mergedGrammarErrors.length > 0 ? (
                      <ul className="mt-3 space-y-2.5">
                        {mergedGrammarErrors.map((item, idx) => (
                          <li key={item.id || `ge-${idx}`} className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5 text-sm">
                            <p>
                              <span className="text-red-500 line-through">{item.original}</span>
                              {' → '}
                              <span className="font-medium text-green-600">{item.correction}</span>
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">{item.reason}</p>
                            {detailReady && item.id && (
                              <SuggestionChatBox
                                submitId={submitDetail.id}
                                suggestionId={item.id}
                                label={item.original}
                              />
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : grammarProse ? (
                      <AiMarkdownContent content={grammarProse} className="mt-2" />
                    ) : (
                      <p className="mt-3 text-sm text-neutral-400">未发现语法错误，写得不错！</p>
                    )}
                  </div>
                )}

                {/* ── 词汇提升建议 ── */}
                {(vocabPreview || mergedVocabSuggestions.length > 0 || vocabProse) && (
                  <div className="mt-4">
                    <div className="flex items-center gap-1.5 border-b border-neutral-100 pb-2">
                      <Lightbulb size={14} className="text-neutral-400" />
                      <h5 className="text-[13px] font-medium text-neutral-700">提升建议</h5>
                      {mergedVocabSuggestions.length > 0 && (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500">
                          {mergedVocabSuggestions.length} 条
                        </span>
                      )}
                    </div>
                    {mergedVocabSuggestions.length > 0 ? (
                      <ul className="mt-3 space-y-2.5">
                        {mergedVocabSuggestions.map((item, idx) => (
                          <li
                            key={item.id || `vs-${idx}`}
                            data-vocab-hint
                            data-vocab-translation={item.suggestion}
                            className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5 text-sm"
                          >
                            <p>
                              {item.original} → <span className="font-medium">{item.suggestion}</span>
                            </p>
                            {item.context && (
                              <p className="mt-1 text-xs text-neutral-500">{item.context}</p>
                            )}
                            {detailReady && item.id && (
                              <SuggestionChatBox
                                submitId={submitDetail.id}
                                suggestionId={item.id}
                                label={item.original}
                              />
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : vocabProse ? (
                      <AiMarkdownContent content={vocabProse} className="mt-2" />
                    ) : (
                      <p className="mt-3 text-sm text-neutral-400">未发现需优化的词汇，用词准确！</p>
                    )}
                  </div>
                )}

                {/* 无AI结果 */}
                {!hasAnyAiResult && (
                  <p className="mt-4 text-sm text-neutral-400">
                    暂无 AI 批改内容。在写作页开启「AI 检查与修改」「结构与评分」或「提升建议」后提交，结果会显示在这里。
                  </p>
                )}
              </div>
              </VocabularySelectionAdd>
              </SubmitVersionNav>
              </>
            )
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}