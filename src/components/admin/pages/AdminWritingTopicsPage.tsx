import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import {
  batchCreateAdminWritingTopics,
  createAdminWritingTopic,
  deleteAdminWritingTopic,
  downloadWritingTopicsTemplate,
  generateAdminWritingTopics,
  getAdminWritingTopic,
  importAdminWritingTopics,
  listAdminTopicTypes,
  listAdminWritingTopics,
  updateAdminWritingTopic,
  type AdminTopicTypeItem,
  type AdminWritingTopicDetail,
  type AdminWritingTopicGenerateItem,
  type AdminWritingTopicListItem,
} from '../../../api/admin'
import { useAppConfirm } from '../../../context/AppConfirmContext'
import {
  AdminCard,
  AdminEmpty,
  AdminError,
  AdminGhostButton,
  AdminModal,
  AdminPageBody,
  AdminPageHeader,
  AdminPrimaryButton,
} from '../AdminUi'
import { useReportReady } from '../../../hooks/useReportReady'

const AI_COUNTS = [1, 5, 10, 20] as const
const ENABLED_FILTERS = [
  { value: '', label: '全部状态' },
  { value: 'true', label: '启用' },
  { value: 'false', label: '停用' },
] as const

const inputClass =
  'w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:bg-white'
const selectClass =
  'w-full rounded border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-sm outline-none focus:border-neutral-400 focus:bg-white'

export function AdminWritingTopicsPage({ onReady }: { onReady?: () => void } = {}) {
  const { confirm } = useAppConfirm()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [topicTypes, setTopicTypes] = useState<AdminTopicTypeItem[]>([])
  const [items, setItems] = useState<AdminWritingTopicListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [enabledFilter, setEnabledFilter] = useState('')
  const [keyword, setKeyword] = useState('')
  const [keywordDraft, setKeywordDraft] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formType, setFormType] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formWordLimit, setFormWordLimit] = useState('')
  const [formEnabled, setFormEnabled] = useState(true)
  const [formSaving, setFormSaving] = useState(false)

  const [showBatch, setShowBatch] = useState(false)
  const [batchJson, setBatchJson] = useState('')
  const [batchResult, setBatchResult] = useState<{
    total: number
    success: number
    failed: number
    errors: Array<{ index: number; message: string }>
  } | null>(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState<AdminWritingTopicDetail | null>(null)

  const [showAi, setShowAi] = useState(false)
  const [aiCount, setAiCount] = useState<(typeof AI_COUNTS)[number]>(5)
  const [aiType, setAiType] = useState('mixed')
  const [aiWordLimit, setAiWordLimit] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [aiImporting, setAiImporting] = useState(false)
  const [aiPreview, setAiPreview] = useState<AdminWritingTopicGenerateItem[]>([])
  const [aiWarnings, setAiWarnings] = useState<string[]>([])

  const enabledTypes = topicTypes.filter((t) => t.isEnabled)

  const loadTypes = useCallback(async () => {
    try {
      const data = await listAdminTopicTypes()
      setTopicTypes(data.items)
      setFormType((prev) => {
        if (prev) return prev
        return data.items.find((t) => t.isEnabled)?.name ?? ''
      })
    } catch {
      /* 类型加载失败不阻塞列表 */
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listAdminWritingTopics({
        page,
        pageSize: 20,
        type: typeFilter || undefined,
        isEnabled: enabledFilter === '' ? undefined : enabledFilter === 'true',
        keyword: keyword || undefined,
      })
      setItems(data.items)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载写作题目失败')
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, enabledFilter, keyword])

  useEffect(() => {
    void loadTypes()
  }, [loadTypes])

  useEffect(() => {
    void load()
  }, [load])

  useReportReady(!loading, onReady)

  const flashSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const resetForm = () => {
    setEditingId(null)
    setFormType(enabledTypes[0]?.name ?? '')
    setFormTitle('')
    setFormDescription('')
    setFormWordLimit('')
    setFormEnabled(true)
  }

  const openCreate = () => {
    resetForm()
    setShowForm(true)
    setShowBatch(false)
    setShowAi(false)
  }

  const openEdit = (item: AdminWritingTopicListItem) => {
    setEditingId(item.id)
    setFormType(item.type)
    setFormTitle(item.title)
    setFormDescription(item.description)
    setFormWordLimit(item.wordLimit)
    setFormEnabled(item.isEnabled)
    setShowForm(true)
    setShowBatch(false)
    setShowAi(false)
  }

  const handleSave = async () => {
    if (!formType.trim() || !formTitle.trim() || !formDescription.trim()) {
      setError('类型、标题、题目描述均为必填')
      return
    }
    setFormSaving(true)
    setError('')
    try {
      if (editingId != null) {
        await updateAdminWritingTopic(editingId, {
          type: formType.trim(),
          title: formTitle.trim(),
          description: formDescription.trim(),
          wordLimit: formWordLimit.trim() || undefined,
          isEnabled: formEnabled,
        })
        flashSuccess('写作题目已更新')
      } else {
        await createAdminWritingTopic({
          type: formType.trim(),
          title: formTitle.trim(),
          description: formDescription.trim(),
          wordLimit: formWordLimit.trim() || undefined,
          isEnabled: formEnabled,
        })
        flashSuccess('写作题目已添加')
      }
      setShowForm(false)
      resetForm()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setFormSaving(false)
    }
  }

  const handleToggle = async (item: AdminWritingTopicListItem) => {
    try {
      await updateAdminWritingTopic(item.id, { isEnabled: !item.isEnabled })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新状态失败')
    }
  }

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: '删除写作题目',
      message: '确定删除该题目？若已被用户提交引用则无法删除，建议改为停用。',
      confirmLabel: '删除',
      variant: 'warning',
    })
    if (!ok) return
    try {
      await deleteAdminWritingTopic(id)
      flashSuccess('写作题目已删除')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleViewDetail = async (id: number) => {
    setDetailOpen(true)
    setDetail(null)
    setDetailLoading(true)
    setError('')
    try {
      setDetail(await getAdminWritingTopic(id))
    } catch (err) {
      setDetailOpen(false)
      setError(err instanceof Error ? err.message : '加载详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleBatchImport = async () => {
    if (!batchJson.trim()) return
    try {
      const parsed = JSON.parse(batchJson) as unknown
      const topics = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object' && Array.isArray((parsed as { topics?: unknown }).topics)
          ? (parsed as { topics: unknown[] }).topics
          : null
      if (!topics) {
        setError('JSON 须为题目数组，或包含 topics 字段的对象')
        return
      }
      const result = await batchCreateAdminWritingTopics(
        topics as Array<{
          type: string
          title: string
          description: string
          wordLimit?: string
          isEnabled?: boolean
        }>,
      )
      setBatchResult(result)
      if (result.success > 0) {
        flashSuccess(`批量入库：成功 ${result.success}，失败 ${result.failed}`)
        await load()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败')
    }
  }

  const handleFileImport = async (file: File) => {
    try {
      const result = await importAdminWritingTopics(file)
      flashSuccess(`文件导入：成功 ${result.success}，失败 ${result.failed}`)
      if (result.failed > 0 && result.errors[0]) {
        setError(`部分失败：${result.errors[0].message}`)
      }
      if (result.success > 0) await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '文件导入失败')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleTemplate = async () => {
    try {
      const blob = await downloadWritingTopicsTemplate()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'writing_topic_import_template.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : '下载模板失败')
    }
  }

  const handleAiGenerate = async () => {
    setAiBusy(true)
    setError('')
    setAiPreview([])
    setAiWarnings([])
    try {
      const result = await generateAdminWritingTopics({
        count: aiCount,
        type: aiType || undefined,
        wordLimit: aiWordLimit.trim() || undefined,
      })
      setAiPreview(result.topics ?? [])
      setAiWarnings(result.warnings ?? [])
      if ((result.topics?.length ?? 0) === 0) {
        setError('AI 未生成有效题目，请调整参数后重试')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 生成失败')
    } finally {
      setAiBusy(false)
    }
  }

  const handleAiImport = async () => {
    if (aiPreview.length === 0) return
    const ok = await confirm({
      title: '写入写作题库',
      message: `确认将预览中的 ${aiPreview.length} 道题写入题库？`,
      confirmLabel: '写入',
      variant: 'default',
    })
    if (!ok) return

    setAiImporting(true)
    setError('')
    try {
      const result = await batchCreateAdminWritingTopics(aiPreview)
      if (result.success > 0) {
        flashSuccess(`AI 题目已写入：成功 ${result.success}，失败 ${result.failed}`)
        setShowAi(false)
        setAiPreview([])
        setAiWarnings([])
        await load()
      } else {
        setError(
          result.errors[0]
            ? `写入失败：${result.errors[0].message}`
            : '写入失败，请检查预览内容',
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '写入题库失败')
    } finally {
      setAiImporting(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader
        title="写作题库"
        description="管理日常写作题目，支持增删改查、文件导入与 AI 出题"
        actions={
          <>
            <AdminGhostButton onClick={() => void handleTemplate()}>下载模板</AdminGhostButton>
            <AdminGhostButton onClick={() => fileInputRef.current?.click()}>
              文件导入
            </AdminGhostButton>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,text/csv,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleFileImport(file)
              }}
            />
            <AdminGhostButton
              onClick={() => {
                setShowBatch(true)
                setShowForm(false)
                setShowAi(false)
                setBatchResult(null)
              }}
            >
              JSON 导入
            </AdminGhostButton>
            <AdminGhostButton
              onClick={() => {
                setShowAi(true)
                setShowForm(false)
                setShowBatch(false)
                setAiPreview([])
                setAiWarnings([])
                setError('')
              }}
            >
              <span className="inline-flex items-center gap-1">
                <Sparkles size={12} />
                AI 一键出题
              </span>
            </AdminGhostButton>
            <AdminPrimaryButton onClick={openCreate}>添加题目</AdminPrimaryButton>
          </>
        }
      />
      <AdminPageBody>
        {error ? (
          <div className="mb-4">
            <AdminError message={error} />
          </div>
        ) : null}
        {successMsg ? (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {successMsg}
          </div>
        ) : null}

        <AdminCard className="mb-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-neutral-400">类型:</span>
              <button
                type="button"
                onClick={() => {
                  setTypeFilter('')
                  setPage(1)
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  typeFilter === ''
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                全部
              </button>
              {topicTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTypeFilter(t.name)
                    setPage(1)
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    typeFilter === t.name
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-neutral-400">状态:</span>
              {ENABLED_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => {
                    setEnabledFilter(f.value)
                    setPage(1)
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    enabledFilter === f.value
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <div className="ml-auto flex min-w-[200px] flex-1 items-center gap-2 sm:max-w-xs">
                <input
                  value={keywordDraft}
                  onChange={(e) => setKeywordDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setKeyword(keywordDraft.trim())
                      setPage(1)
                    }
                  }}
                  placeholder="搜索标题 / 描述"
                  className={inputClass}
                />
                <AdminGhostButton
                  onClick={() => {
                    setKeyword(keywordDraft.trim())
                    setPage(1)
                  }}
                >
                  搜索
                </AdminGhostButton>
              </div>
            </div>
          </div>
        </AdminCard>

        {showAi && (
          <AdminCard className="mb-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-neutral-600" />
              <p className="text-sm font-medium text-neutral-700">AI 一键出题</p>
            </div>
            <p className="mb-3 text-xs text-neutral-500">
              调用后端生成预览（不会直接入库）。确认预览无误后再写入题库。
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-neutral-400">生成数量</label>
                <div className="flex flex-wrap gap-1.5">
                  {AI_COUNTS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAiCount(n)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                        aiCount === n
                          ? 'bg-neutral-900 text-white'
                          : 'border border-neutral-200 bg-neutral-50 text-neutral-600'
                      }`}
                    >
                      {n} 题
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-neutral-400">题目类型</label>
                <select
                  value={aiType}
                  onChange={(e) => setAiType(e.target.value)}
                  className={selectClass}
                >
                  <option value="mixed">混合类型</option>
                  {enabledTypes.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-neutral-400">字数要求（可选）</label>
                <input
                  value={aiWordLimit}
                  onChange={(e) => setAiWordLimit(e.target.value)}
                  placeholder="如 120-150"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <AdminPrimaryButton disabled={aiBusy || aiImporting} onClick={() => void handleAiGenerate()}>
                {aiBusy ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" />
                    生成中…
                  </span>
                ) : (
                  `生成 ${aiCount} 题预览`
                )}
              </AdminPrimaryButton>
              <AdminPrimaryButton
                disabled={aiBusy || aiImporting || aiPreview.length === 0}
                onClick={() => void handleAiImport()}
              >
                {aiImporting ? '写入中…' : `确认写入题库（${aiPreview.length}）`}
              </AdminPrimaryButton>
              <AdminGhostButton
                disabled={aiBusy || aiImporting}
                onClick={() => {
                  setShowAi(false)
                  setAiPreview([])
                  setAiWarnings([])
                }}
              >
                取消
              </AdminGhostButton>
            </div>

            {aiWarnings.length > 0 && (
              <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                {aiWarnings.slice(0, 8).map((w) => (
                  <p key={w}>{w}</p>
                ))}
              </div>
            )}

            {aiPreview.length > 0 && (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-medium text-neutral-500">
                  预览（{aiPreview.length} 题）— 仅预览，未入库
                </p>
                <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-100">
                  {aiPreview.map((t, index) => (
                    <li key={`${t.title}-${index}`} className="px-3 py-3">
                      <p className="text-sm font-medium text-neutral-900">
                        <span className="mr-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500">
                          {t.type}
                        </span>
                        {t.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{t.description}</p>
                      <p className="mt-1 text-xs text-neutral-400">字数：{t.wordLimit || '—'}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </AdminCard>
        )}

        {showBatch && (
          <AdminCard className="mb-4">
            <p className="mb-2 text-sm font-medium text-neutral-700">
              批量导入（JSON，最多 200 条）
            </p>
            <textarea
              value={batchJson}
              onChange={(e) => setBatchJson(e.target.value)}
              rows={10}
              placeholder='[{"type":"CET4","title":"...","description":"...","wordLimit":"120-150","isEnabled":true},...]'
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs outline-none focus:border-neutral-400 focus:bg-white"
            />
            <div className="mt-3 flex gap-2">
              <AdminPrimaryButton onClick={() => void handleBatchImport()}>导入</AdminPrimaryButton>
              <AdminGhostButton
                onClick={() => {
                  setShowBatch(false)
                  setBatchResult(null)
                  setBatchJson('')
                }}
              >
                取消
              </AdminGhostButton>
            </div>
            {batchResult && (
              <div className="mt-3 rounded border border-neutral-200 p-3 text-sm">
                <p>
                  总计: {batchResult.total} · 成功:{' '}
                  <span className="text-green-600">{batchResult.success}</span> · 失败:{' '}
                  <span className="text-red-600">{batchResult.failed}</span>
                </p>
                {batchResult.errors.slice(0, 10).map((e) => (
                  <p key={e.index} className="mt-1 text-xs text-red-500">
                    第 {e.index + 1} 题: {e.message}
                  </p>
                ))}
              </div>
            )}
          </AdminCard>
        )}

        {showForm && (
          <AdminCard className="mb-4">
            <p className="mb-3 text-sm font-medium text-neutral-700">
              {editingId != null ? '编辑写作题目' : '添加写作题目'}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-neutral-400">类型</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className={selectClass}
                >
                  {enabledTypes.length === 0 ? (
                    <option value="">暂无可用类型</option>
                  ) : (
                    enabledTypes.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-neutral-400">字数要求</label>
                <input
                  value={formWordLimit}
                  onChange={(e) => setFormWordLimit(e.target.value)}
                  placeholder="如 120-150（可空）"
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-neutral-400">标题</label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="题目标题"
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-neutral-400">题目描述</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={4}
                  placeholder="写作要求 / 提示语"
                  className={inputClass}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  checked={formEnabled}
                  onChange={(e) => setFormEnabled(e.target.checked)}
                  className="rounded border-neutral-300"
                />
                启用
              </label>
            </div>
            <div className="mt-3 flex gap-2">
              <AdminPrimaryButton disabled={formSaving} onClick={() => void handleSave()}>
                {formSaving ? '保存中…' : '保存'}
              </AdminPrimaryButton>
              <AdminGhostButton
                disabled={formSaving}
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
              >
                取消
              </AdminGhostButton>
            </div>
          </AdminCard>
        )}

        <AdminCard className="overflow-hidden p-0 sm:p-0">
          {loading ? (
            <AdminEmpty message="加载中…" />
          ) : items.length === 0 ? (
            <AdminEmpty message="暂无写作题目" />
          ) : (
            <>
              <ul className="divide-y divide-neutral-100">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900">
                        <span className="mr-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500">
                          {item.type}
                        </span>
                        {item.title}
                        {!item.isEnabled && (
                          <span className="ml-2 text-xs text-red-400">已停用</span>
                        )}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-neutral-400">
                        {item.description}
                      </p>
                      <p className="mt-1 text-xs text-neutral-400">
                        字数 {item.wordLimit || '—'} ·{' '}
                        {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminGhostButton onClick={() => void handleViewDetail(item.id)}>
                        详情
                      </AdminGhostButton>
                      <AdminGhostButton onClick={() => openEdit(item)}>编辑</AdminGhostButton>
                      <AdminGhostButton onClick={() => void handleToggle(item)}>
                        {item.isEnabled ? '停用' : '启用'}
                      </AdminGhostButton>
                      <AdminGhostButton onClick={() => void handleDelete(item.id)}>
                        删除
                      </AdminGhostButton>
                    </div>
                  </li>
                ))}
              </ul>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 border-t border-neutral-100 px-4 py-3">
                  <AdminGhostButton
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                  >
                    上一页
                  </AdminGhostButton>
                  <span className="text-xs text-neutral-400">
                    {page} / {totalPages}
                  </span>
                  <AdminGhostButton
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                  >
                    下一页
                  </AdminGhostButton>
                </div>
              )}
            </>
          )}
        </AdminCard>
      </AdminPageBody>

      <AdminModal
        open={detailOpen}
        title="写作题目详情"
        size="lg"
        onClose={() => {
          setDetailOpen(false)
          setDetail(null)
        }}
        footer={
          <div className="flex gap-2">
            {detail ? (
              <AdminPrimaryButton
                onClick={() => {
                  setDetailOpen(false)
                  openEdit(detail)
                }}
              >
                编辑
              </AdminPrimaryButton>
            ) : null}
            <AdminGhostButton
              onClick={() => {
                setDetailOpen(false)
                setDetail(null)
              }}
            >
              关闭
            </AdminGhostButton>
          </div>
        }
      >
        {detailLoading || !detail ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-neutral-400">
            <Loader2 size={16} className="animate-spin" />
            加载详情…
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-3 text-xs text-neutral-500 sm:grid-cols-3">
              <p>
                类型：
                <span className="ml-1 font-medium text-neutral-800">{detail.type}</span>
              </p>
              <p>
                状态：
                <span className="ml-1 font-medium text-neutral-800">
                  {detail.isEnabled ? '启用' : '停用'}
                </span>
              </p>
              <p>
                提交次数：
                <span className="ml-1 font-medium text-neutral-800">{detail.submitCount}</span>
              </p>
              <p>
                字数：
                <span className="ml-1 font-medium text-neutral-800">
                  {detail.wordLimit || '—'}
                </span>
              </p>
              <p className="col-span-2">
                创建：
                <span className="ml-1 font-medium text-neutral-800">
                  {new Date(detail.createdAt).toLocaleString('zh-CN')}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900">{detail.title}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-600">
                {detail.description}
              </p>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  )
}
