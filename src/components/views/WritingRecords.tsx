import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, FileText, LogIn, PenLine } from 'lucide-react'
import {
  getSavedWritingById,
  getSavedWritings,
  getSubmittedWritingById,
  getSubmittedWritings,
} from '../../api/writing'
import { useAuth } from '../../context/AuthContext'
import type { WritingRecord } from '../../types'

type RecordTab = 'saves' | 'submits'

function formatTime(time: string) {
  return new Date(time).toLocaleString()
}

export function WritingRecords() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<RecordTab>('saves')
  const [saves, setSaves] = useState<WritingRecord[]>([])
  const [submits, setSubmits] = useState<WritingRecord[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<WritingRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [mobileShowDetail, setMobileShowDetail] = useState(false)

  const list = tab === 'saves' ? saves : submits

  useEffect(() => {
    if (!user) return

    setLoading(true)
    Promise.all([getSavedWritings(user.id), getSubmittedWritings(user.id)])
      .then(([saveList, submitList]) => {
        setSaves(saveList)
        setSubmits(submitList)
      })
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (!user || !selectedId) {
      setSelectedRecord(null)
      return
    }

    const loader =
      tab === 'saves'
        ? getSavedWritingById(user.id, selectedId)
        : getSubmittedWritingById(user.id, selectedId)

    loader.then(setSelectedRecord).catch(() => setSelectedRecord(null))
  }, [user, selectedId, tab])

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
          <LogIn size={28} className="text-neutral-400" strokeWidth={1.5} />
        </div>
        <h2 className="mt-5 text-lg font-medium text-neutral-800">登录后查看写作记录</h2>
        <p className="mt-2 max-w-sm text-center text-sm text-neutral-400">
          你的保存和提交记录保存在项目 data 目录的 JSON 文件中
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
        className={`flex w-full shrink-0 flex-col border-r border-neutral-200 bg-white md:w-80 lg:w-96 ${
          mobileShowDetail ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <div className="border-b border-neutral-200 px-4 py-4 sm:px-5 sm:py-5">
          <h2 className="text-lg font-semibold text-neutral-900">写作记录</h2>
          <p className="mt-1 text-xs text-neutral-400">按 ID 查看保存与提交记录</p>
        </div>

        <div className="flex gap-1 border-b border-neutral-200 p-2">
          <button
            type="button"
            onClick={() => {
              setTab('saves')
              setSelectedId(null)
              setMobileShowDetail(false)
            }}
            className={`flex-1 rounded-lg py-2 text-sm transition-colors ${
              tab === 'saves'
                ? 'bg-neutral-100 font-medium text-neutral-900'
                : 'text-neutral-500 hover:bg-neutral-50'
            }`}
          >
            保存记录 ({saves.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('submits')
              setSelectedId(null)
              setMobileShowDetail(false)
            }}
            className={`flex-1 rounded-lg py-2 text-sm transition-colors ${
              tab === 'submits'
                ? 'bg-neutral-100 font-medium text-neutral-900'
                : 'text-neutral-500 hover:bg-neutral-50'
            }`}
          >
            提交记录 ({submits.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading && <p className="px-3 py-4 text-sm text-neutral-400">加载中…</p>}
          {!loading && list.length === 0 && (
            <p className="px-3 py-4 text-sm text-neutral-400">
              {tab === 'saves' ? '暂无保存记录' : '暂无提交记录'}
            </p>
          )}
          {list.map((record) => (
            <button
              key={record.id}
              type="button"
              onClick={() => {
                setSelectedId(record.id)
                setMobileShowDetail(true)
              }}
              className={`mb-1 w-full rounded-lg px-3 py-3 text-left transition-colors ${
                selectedId === record.id
                  ? 'bg-neutral-100'
                  : 'hover:bg-neutral-50'
              }`}
            >
              <p className="truncate text-sm font-medium text-neutral-900">
                {record.title || '无标题'}
              </p>
              <p className="mt-1 truncate text-xs text-neutral-400">{record.topic}</p>
              <div className="mt-2 flex items-center gap-1 text-xs text-neutral-400">
                <Clock size={12} />
                {formatTime(record.time)}
              </div>
              <p className="mt-1 font-mono text-[10px] text-neutral-300">{record.id}</p>
            </button>
          ))}
        </div>
      </div>

      <div
        className={`flex-1 overflow-y-auto bg-[#fafafa] px-4 py-5 sm:px-6 sm:py-8 lg:px-8 ${
          mobileShowDetail ? 'flex flex-col' : 'hidden lg:block'
        }`}
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

        {!selectedRecord && (
          <div className="flex h-full flex-col items-center justify-center text-neutral-400">
            <FileText size={32} strokeWidth={1.5} />
            <p className="mt-3 text-sm">选择一条记录查看详情</p>
          </div>
        )}

        {selectedRecord && (
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-500">
                    {tab === 'saves' ? '保存记录' : '提交记录'}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-neutral-900 sm:text-xl">
                    {selectedRecord.title || '无标题'}
                  </h3>
                </div>
                {tab === 'saves' && (
                  <button
                    type="button"
                    onClick={() => navigate(`/writing?draftId=${selectedRecord.id}`)}
                    className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    <PenLine size={14} />
                    继续编辑
                  </button>
                )}
              </div>

              <dl className="mt-6 space-y-3 border-t border-neutral-100 pt-5 text-sm">
                <div>
                  <dt className="text-neutral-400">ID</dt>
                  <dd className="mt-0.5 font-mono text-neutral-700">{selectedRecord.id}</dd>
                </div>
                <div>
                  <dt className="text-neutral-400">题目</dt>
                  <dd className="mt-0.5 leading-relaxed text-neutral-800">{selectedRecord.topic}</dd>
                </div>
                <div>
                  <dt className="text-neutral-400">题目类型</dt>
                  <dd className="mt-0.5 text-neutral-700">{selectedRecord.topicType}</dd>
                </div>
                <div>
                  <dt className="text-neutral-400">时间</dt>
                  <dd className="mt-0.5 text-neutral-700">{formatTime(selectedRecord.time)}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:mt-6 sm:p-6">
              <h4 className="text-sm font-medium text-neutral-500">正文内容</h4>
              <div
                className="notion-editor mt-4 text-neutral-800"
                dangerouslySetInnerHTML={{ __html: selectedRecord.content || '<p></p>' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
