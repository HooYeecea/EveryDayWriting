import { useCallback, useEffect, useRef, useState } from 'react'
import {
  batchCreateAdminQuestions,
  createAdminQuestion,
  deleteAdminQuestion,
  downloadQuestionsTemplate,
  exportAdminQuestions,
  listAdminQuestions,
  toggleAdminQuestion,
  type AdminQuestionListItem,
} from '../../../api/admin'
import { useAppConfirm } from '../../../context/AppConfirmContext'
import {
  AdminCard,
  AdminEmpty,
  AdminError,
  AdminGhostButton,
  AdminPageBody,
  AdminPageHeader,
  AdminPrimaryButton,
} from '../AdminUi'

const EXAM_TYPES = ['', 'CET4', 'CET6', 'IELTS', 'TOEFL', 'Postgraduate', 'General']
const EXAM_LABELS: Record<string, string> = {
  '': '全部类型',
  CET4: '四级',
  CET6: '六级',
  IELTS: '雅思',
  TOEFL: '托福',
  Postgraduate: '考研',
  General: '通用',
}
const STEP_LABELS: Record<number, string> = {
  1: '词汇选择',
  2: '语法判断',
  3: '句型改写',
  4: '段落纠错',
  5: '短写作',
}

export function AdminQuestionsPage() {
  const { confirm } = useAppConfirm()
  const [items, setItems] = useState<AdminQuestionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [examFilter, setExamFilter] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [createStep, setCreateStep] = useState(1)
  const [createType, setCreateType] = useState('vocabulary')
  const [createExam, setCreateExam] = useState('General')
  const [createDifficulty, setCreateDifficulty] = useState(3)
  const [createContent, setCreateContent] = useState('')
  const [createAnswer, setCreateAnswer] = useState('')

  // Batch import
  const [showBatch, setShowBatch] = useState(false)
  const [batchJson, setBatchJson] = useState('')
  const [batchResult, setBatchResult] = useState<{ total: number; success: number; failed: number; errors: Array<{ index: number; message: string }> } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listAdminQuestions({
        page,
        pageSize: 20,
        examType: examFilter || undefined,
      })
      setItems(data.items)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [page, examFilter])

  useEffect(() => {
    void load()
  }, [load])

  const handleCreate = async () => {
    if (!createContent.trim()) return
    try {
      let contentObj: unknown
      let answerObj: unknown
      try {
        contentObj = JSON.parse(createContent)
        answerObj = JSON.parse(createAnswer)
      } catch {
        setError('content 和 answer 必须是合法的 JSON')
        return
      }
      await createAdminQuestion({
        stepNumber: createStep,
        questionType: createType,
        examType: createExam,
        difficulty: createDifficulty,
        content: contentObj,
        answer: answerObj,
      })
      setShowCreate(false)
      setCreateContent('')
      setCreateAnswer('')
      setSuccessMsg('题目已添加')
      setTimeout(() => setSuccessMsg(''), 3000)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败')
    }
  }

  const handleBatchImport = async () => {
    if (!batchJson.trim()) return
    try {
      const questions = JSON.parse(batchJson)
      if (!Array.isArray(questions)) {
        setError('JSON 必须是题目数组')
        return
      }
      const result = await batchCreateAdminQuestions(questions)
      setBatchResult(result)
      if (result.success > 0) await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败')
    }
  }

  const handleExport = async (format: string) => {
    try {
      if (format === 'csv') {
        const blob = await exportAdminQuestions({ format: 'csv', examType: examFilter || undefined }) as Blob
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `question_bank_${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const data = await exportAdminQuestions({ format: 'json', examType: examFilter || undefined })
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `question_bank_${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出失败')
    }
  }

  const handleTemplate = async () => {
    try {
      const blob = await downloadQuestionsTemplate()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'question_import_template.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : '下载模板失败')
    }
  }

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    try {
      await toggleAdminQuestion(id, !currentEnabled)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败')
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: '删除题目',
      message: '确定删除该题目？',
      confirmLabel: '删除',
      variant: 'warning',
    })
    if (!ok) return
    try {
      await deleteAdminQuestion(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader
        title="题库管理"
        description="管理测评题库，支持按考试类型筛选、批量导入和导出"
        actions={
          <>
            <AdminGhostButton onClick={handleTemplate}>下载模板</AdminGhostButton>
            <AdminGhostButton onClick={() => void handleExport('csv')}>导出 CSV</AdminGhostButton>
            <AdminGhostButton onClick={() => void handleExport('json')}>导出 JSON</AdminGhostButton>
            <AdminGhostButton onClick={() => setShowBatch(true)}>批量导入</AdminGhostButton>
            <AdminPrimaryButton onClick={() => setShowCreate(true)}>添加题目</AdminPrimaryButton>
          </>
        }
      />
      <AdminPageBody>
        {error ? <div className="mb-4"><AdminError message={error} /></div> : null}
        {successMsg ? <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{successMsg}</div> : null}

        {/* Filter */}
        <AdminCard className="mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-400">筛选:</span>
            {EXAM_TYPES.map((et) => (
              <button
                key={et}
                type="button"
                onClick={() => { setExamFilter(et); setPage(1) }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  examFilter === et
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {EXAM_LABELS[et] ?? et}
              </button>
            ))}
          </div>
        </AdminCard>

        {/* Batch Import Panel */}
        {showBatch && (
          <AdminCard className="mb-4">
            <p className="mb-2 text-sm font-medium text-neutral-700">批量导入（JSON 格式，最多 200 条）</p>
            <textarea
              value={batchJson}
              onChange={(e) => setBatchJson(e.target.value)}
              rows={10}
              placeholder='[{"stepNumber":1,"questionType":"vocabulary","examType":"CET4","difficulty":2,"content":{...},"answer":{...}},...]'
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs outline-none focus:border-neutral-400 focus:bg-white"
            />
            <div className="mt-3 flex gap-2">
              <AdminPrimaryButton onClick={() => void handleBatchImport()}>导入</AdminPrimaryButton>
              <AdminGhostButton onClick={() => { setShowBatch(false); setBatchResult(null); setBatchJson('') }}>取消</AdminGhostButton>
            </div>
            {batchResult && (
              <div className="mt-3 rounded border border-neutral-200 p-3 text-sm">
                <p>总计: {batchResult.total} · 成功: <span className="text-green-600">{batchResult.success}</span> · 失败: <span className="text-red-600">{batchResult.failed}</span></p>
                {batchResult.errors.slice(0, 10).map((e) => (
                  <p key={e.index} className="mt-1 text-xs text-red-500">第 {e.index + 1} 题: {e.message}</p>
                ))}
              </div>
            )}
          </AdminCard>
        )}

        {/* Create Panel */}
        {showCreate && (
          <AdminCard className="mb-4">
            <p className="mb-3 text-sm font-medium text-neutral-700">添加新题目</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs text-neutral-400">步骤</label>
                <select value={createStep} onChange={(e) => setCreateStep(Number(e.target.value))} className="w-full rounded border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-sm">
                  {[1, 2, 3, 4, 5].map((s) => <option key={s} value={s}>{s} - {STEP_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-neutral-400">题型</label>
                <select value={createType} onChange={(e) => setCreateType(e.target.value)} className="w-full rounded border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-sm">
                  <option value="vocabulary">词汇选择</option>
                  <option value="grammar_judge">语法判断</option>
                  <option value="sentence_rewrite">句型改写</option>
                  <option value="error_correction">段落纠错</option>
                  <option value="short_writing">短写作</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-neutral-400">考试类型</label>
                <select value={createExam} onChange={(e) => setCreateExam(e.target.value)} className="w-full rounded border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-sm">
                  {EXAM_TYPES.filter(Boolean).map((et) => <option key={et} value={et}>{EXAM_LABELS[et]}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-neutral-400">难度</label>
                <select value={createDifficulty} onChange={(e) => setCreateDifficulty(Number(e.target.value))} className="w-full rounded border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-sm">
                  {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-neutral-400">Content (JSON)</label>
                <textarea value={createContent} onChange={(e) => setCreateContent(e.target.value)} rows={4} placeholder='{"sentence":"...","options":[...]}' className="w-full rounded border border-neutral-200 bg-neutral-50 px-2 py-1.5 font-mono text-xs" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-neutral-400">Answer (JSON)</label>
                <textarea value={createAnswer} onChange={(e) => setCreateAnswer(e.target.value)} rows={4} placeholder='{"correctOption":"A"}' className="w-full rounded border border-neutral-200 bg-neutral-50 px-2 py-1.5 font-mono text-xs" />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <AdminPrimaryButton onClick={() => void handleCreate()}>创建</AdminPrimaryButton>
              <AdminGhostButton onClick={() => { setShowCreate(false); setCreateContent(''); setCreateAnswer('') }}>取消</AdminGhostButton>
            </div>
          </AdminCard>
        )}

        {/* Question List */}
        <AdminCard className="overflow-hidden p-0 sm:p-0">
          {loading ? (
            <AdminEmpty message="加载中…" />
          ) : items.length === 0 ? (
            <AdminEmpty message="暂无题目" />
          ) : (
            <>
              <ul className="divide-y divide-neutral-100">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900">
                        <span className="mr-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500">
                          {EXAM_LABELS[item.examType] ?? item.examType}
                        </span>
                        步骤{item.stepNumber} · {item.questionType} · 难度{item.difficulty}
                        {!item.isEnabled && <span className="ml-2 text-xs text-red-400">已禁用</span>}
                      </p>
                      <p className="mt-1 truncate text-xs text-neutral-400">
                        {typeof item.content === 'object' ? JSON.stringify(item.content).slice(0, 100) : String(item.content ?? '').slice(0, 100)}
                      </p>
                    </div>
                    <div className="flex gap-2 text-xs text-neutral-400">
                      <span>使用 {item.usageCount} 次</span>
                      <AdminGhostButton onClick={() => void handleToggle(item.id, item.isEnabled)}>
                        {item.isEnabled ? '禁用' : '启用'}
                      </AdminGhostButton>
                      <AdminGhostButton onClick={() => void handleDelete(item.id)}>删除</AdminGhostButton>
                    </div>
                  </li>
                ))}
              </ul>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 border-t border-neutral-100 px-4 py-3">
                  <AdminGhostButton onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>上一页</AdminGhostButton>
                  <span className="text-xs text-neutral-400">{page} / {totalPages}</span>
                  <AdminGhostButton onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>下一页</AdminGhostButton>
                </div>
              )}
            </>
          )}
        </AdminCard>
      </AdminPageBody>
    </div>
  )
}
