import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, FileText, LogIn, PenLine, Sparkles } from 'lucide-react'
import {
  deleteDraft,
  deleteSubmit,
  getDrafts,
  getSubmittedWritingById,
  getSubmittedWritings,
} from '../../api/writing'
import { useAuth } from '../../context/AuthContext'
import type { WritingDraftListItem, WritingSubmitDetail, WritingSubmitListItem } from '../../types'
import {
  MAIN_CONTENT_X_CLASS,
  PANEL_HEADER_CLASS,
  PANEL_HEADER_ROW_CLASS,
  PANEL_SUBTITLE_CLASS,
  PANEL_TITLE_CLASS,
  SIDE_PANEL_WIDTH_CLASS,
} from '../layout/layoutConstants'
import {
  DEFAULT_RECORD_SEARCH_FIELDS,
  type RecordSearchField,
  WritingRecordsSearchBar,
} from '../writing/WritingRecordsSearchBar'

type RecordTab = 'saves' | 'submits'

function formatTime(time: string) {
  return new Date(time).toLocaleString()
}

export function WritingRecords() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const initialTab = (location.state as { tab?: RecordTab } | null)?.tab
  const [tab, setTab] = useState<RecordTab>(initialTab ?? 'saves')
  const [saves, setSaves] = useState<WritingDraftListItem[]>([])
  const [submits, setSubmits] = useState<WritingSubmitListItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submitDetail, setSubmitDetail] = useState<WritingSubmitDetail | null>(null)
  const [selectedDraft, setSelectedDraft] = useState<WritingDraftListItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [mobileShowDetail, setMobileShowDetail] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [activeKeyword, setActiveKeyword] = useState('')
  const [searchFields, setSearchFields] = useState<RecordSearchField[]>(
    DEFAULT_RECORD_SEARCH_FIELDS,
  )

  const [deleting, setDeleting] = useState(false)

  const latestDraftId = saves[0]?.id
  const list = tab === 'saves' ? saves : submits

  const handleDelete = async () => {
    if (!selectedId || deleting) return
    const label = tab === 'saves' ? '草稿' : '提交记录'
    if (!window.confirm(`确定删除这条${label}？`)) return

    setDeleting(true)
    try {
      if (tab === 'saves') {
        await deleteDraft(selectedId)
        setSaves((prev) => prev.filter((item) => item.id !== selectedId))
      } else {
        await deleteSubmit(selectedId)
        setSubmits((prev) => prev.filter((item) => item.id !== selectedId))
      }
      setSelectedId(null)
      setMobileShowDetail(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    } finally {
      setDeleting(false)
    }
  }

  const toggleSearchField = (field: RecordSearchField) => {
    setSearchFields((prev) =>
      prev.includes(field) ? prev.filter((item) => item !== field) : [...prev, field],
    )
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

    setLoading(true)
    if (tab === 'saves') {
      getDrafts(1, 100)
        .then((result) => setSaves(result.items))
        .finally(() => setLoading(false))
      return
    }

    getSubmittedWritings({
      keyword: activeKeyword || undefined,
      page: 1,
      pageSize: 100,
    })
      .then((result) => setSubmits(result.items))
      .finally(() => setLoading(false))
  }, [isAuthenticated, tab, activeKeyword])

  useEffect(() => {
    if (!selectedId) {
      setSubmitDetail(null)
      setSelectedDraft(null)
      return
    }

    if (tab === 'saves') {
      setSubmitDetail(null)
      setSelectedDraft(saves.find((item) => item.id === selectedId) ?? null)
      return
    }

    setSelectedDraft(null)
    getSubmittedWritingById(selectedId)
      .then(setSubmitDetail)
      .catch(() => setSubmitDetail(null))
  }, [selectedId, tab, saves])

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
              <h2 className={PANEL_TITLE_CLASS}>写作记录</h2>
              <p className={`${PANEL_SUBTITLE_CLASS} truncate`}>草稿与提交记录</p>
            </div>
          </div>
        </div>

        <div className="flex gap-1 border-b border-neutral-200 p-2 max-md:flex-row md:flex-col md:gap-0.5">
          <button
            type="button"
            onClick={() => {
              setTab('saves')
              setSelectedId(null)
              setMobileShowDetail(false)
            }}
            className={`flex-1 rounded-lg py-2 text-xs transition-colors sm:text-sm md:flex-none md:px-2 md:text-xs ${
              tab === 'saves'
                ? 'bg-neutral-100 font-medium text-neutral-900'
                : 'text-neutral-500 hover:bg-neutral-50'
            }`}
          >
            草稿
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('submits')
              setSelectedId(null)
              setMobileShowDetail(false)
            }}
            className={`flex-1 rounded-lg py-2 text-xs transition-colors sm:text-sm md:flex-none md:px-2 md:text-xs ${
              tab === 'submits'
                ? 'bg-neutral-100 font-medium text-neutral-900'
                : 'text-neutral-500 hover:bg-neutral-50'
            }`}
          >
            提交记录
          </button>
        </div>

        <div className="shrink-0 lg:hidden">
          <WritingRecordsSearchBar {...searchBarProps} compact />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading && <p className="px-3 py-4 text-sm text-neutral-400">加载中…</p>}
          {!loading && list.length === 0 && (
            <p className="px-3 py-4 text-sm text-neutral-400">
              {tab === 'saves' ? '暂无草稿' : '暂无提交记录'}
            </p>
          )}
          {tab === 'saves' &&
            saves.map((record) => (
              <button
                key={record.id}
                type="button"
                onClick={() => {
                  setSelectedId(record.id)
                  setMobileShowDetail(true)
                }}
                className={`mb-1 w-full rounded-lg px-3 py-3 text-left transition-colors ${
                  selectedId === record.id ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                }`}
              >
                <p className="truncate text-sm font-medium text-neutral-900">
                  {record.title || '无标题'}
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs text-neutral-400">
                  <Clock size={12} />
                  {formatTime(record.updatedAt)}
                </div>
              </button>
            ))}
          {tab === 'submits' &&
            submits.map((record) => (
              <button
                key={record.id}
                type="button"
                onClick={() => {
                  setSelectedId(record.id)
                  setMobileShowDetail(true)
                }}
                className={`mb-1 w-full rounded-lg px-3 py-3 text-left transition-colors ${
                  selectedId === record.id ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                }`}
              >
                <p className="truncate text-sm font-medium text-neutral-900">
                  {record.title || '无标题'}
                </p>
                <p className="mt-1 truncate text-xs text-neutral-400">{record.topicType}</p>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatTime(record.submittedAt)}
                  </span>
                  {record.aiScore !== null && (
                    <span className="font-medium text-neutral-600">{record.aiScore} 分</span>
                  )}
                </div>
              </button>
            ))}
        </div>
      </div>

      <div
        className={`flex min-w-0 flex-1 flex-col overflow-hidden bg-[#fafafa] ${
          mobileShowDetail ? 'flex' : 'hidden lg:flex'
        }`}
      >
        <div className="hidden shrink-0 lg:block">
          <WritingRecordsSearchBar {...searchBarProps} />
        </div>

        <div className={`flex-1 overflow-y-auto py-5 sm:py-8 ${MAIN_CONTENT_X_CLASS}`}>
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
            <div className="flex h-full min-h-[12rem] flex-col items-center justify-center text-neutral-400">
              <FileText size={32} strokeWidth={1.5} />
              <p className="mt-3 text-sm">选择一条记录查看详情</p>
            </div>
          )}

          {tab === 'saves' && selectedDraft && (
            <div className="mx-auto max-w-3xl">
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-500">
                      草稿
                    </span>
                    <h3 className="mt-3 text-lg font-semibold text-neutral-900 sm:text-xl">
                      {selectedDraft.title || '无标题'}
                    </h3>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedDraft.id !== latestDraftId) {
                          alert('当前仅支持编辑最新一条草稿，将为您打开最新草稿。')
                        }
                        navigate(
                          selectedDraft.id === latestDraftId
                            ? `/writing?draftId=${selectedDraft.id}`
                            : '/writing',
                        )
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                      <PenLine size={14} />
                      继续编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      disabled={deleting}
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deleting ? '删除中…' : '删除草稿'}
                    </button>
                  </div>
                </div>
                <dl className="mt-6 space-y-3 border-t border-neutral-100 pt-5 text-sm">
                  <div>
                    <dt className="text-neutral-400">最后更新</dt>
                    <dd className="mt-0.5 text-neutral-700">{formatTime(selectedDraft.updatedAt)}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-sm text-neutral-500">
                  草稿正文请在编辑器中继续编辑查看。
                </p>
              </div>
            </div>
          )}

          {tab === 'submits' && submitDetail && (
            <div className="mx-auto max-w-3xl">
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
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={deleting}
                    className="mt-3 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleting ? '删除中…' : '删除记录'}
                  </button>
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

              {submitDetail.grammarSuggestions.length > 0 && (
                <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
                  <h4 className="text-sm font-medium text-neutral-500">语法建议</h4>
                  <ul className="mt-3 space-y-3">
                    {submitDetail.grammarSuggestions.map((item) => (
                      <li key={item.id} className="rounded-lg bg-neutral-50 px-3 py-2 text-sm">
                        <p>
                          <span className="text-red-600 line-through">{item.original}</span>
                          {' → '}
                          <span className="font-medium text-green-700">{item.correction}</span>
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">{item.reason}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {submitDetail.vocabularySuggestions.length > 0 && (
                <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
                  <h4 className="text-sm font-medium text-neutral-500">词汇建议</h4>
                  <ul className="mt-3 space-y-3">
                    {submitDetail.vocabularySuggestions.map((item) => (
                      <li key={item.id} className="rounded-lg bg-neutral-50 px-3 py-2 text-sm">
                        <p>
                          {item.original} → <span className="font-medium">{item.suggestion}</span>
                        </p>
                        {item.context && (
                          <p className="mt-1 text-xs text-neutral-500">{item.context}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
