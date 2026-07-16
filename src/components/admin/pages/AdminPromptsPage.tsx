import { useCallback, useEffect, useState } from 'react'
import {
  getAdminPrompt,
  getAdminPromptHistory,
  listAdminPrompts,
  rollbackAdminPrompt,
  testAdminPrompt,
  updateAdminPrompt,
  type AdminPromptDetail,
  type AdminPromptHistoryItem,
  type AdminPromptListItem,
  type AdminPromptTestResult,
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
import { BrandLoading } from '../../brand/BrandLoading'
import { useReportReady } from '../../../hooks/useReportReady'

const PURPOSE_LABELS: Record<string, string> = {
  structure: '结构分析',
  grammar: '语法纠错',
  evaluation: '综合评分',
  vocabulary: '用词优化',
  dictionary: '词典查询',
  translation: '中译英',
  brainstorm: '头脑风暴',
  suggestion_followup: '建议追问',
  proficiency_test: '能力测评',
  writing_metrics: '写作指标',
}

type ViewMode = 'list' | 'edit' | 'history' | 'test'

export function AdminPromptsPage({ onReady }: { onReady?: () => void } = {}) {
  const { confirm } = useAppConfirm()
  const [items, setItems] = useState<AdminPromptListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<AdminPromptDetail | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editName, setEditName] = useState('')
  const [editNote, setEditNote] = useState('')
  const [historyItems, setHistoryItems] = useState<AdminPromptHistoryItem[]>([])
  const [testContent, setTestContent] = useState('')
  const [testResult, setTestResult] = useState<AdminPromptTestResult | null>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [viewBusy, setViewBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listAdminPrompts()
      setItems(data.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useReportReady(!loading, onReady)

  const openEdit = async (id: string) => {
    setViewBusy(true)
    setError('')
    try {
      const d = await getAdminPrompt(id)
      setDetail(d)
      setEditContent(d.content)
      setEditName(d.name)
      setEditNote('')
      setSelectedId(id)
      setViewMode('edit')
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取详情失败')
    } finally {
      setViewBusy(false)
    }
  }

  const openHistory = async (id: string) => {
    setViewBusy(true)
    setError('')
    try {
      const data = await getAdminPromptHistory(id)
      setHistoryItems(data.items)
      setSelectedId(id)
      setViewMode('history')
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取历史失败')
    } finally {
      setViewBusy(false)
    }
  }

  const openTest = async (id: string) => {
    setViewBusy(true)
    setError('')
    try {
      const d = await getAdminPrompt(id)
      setDetail(d)
      setTestContent('')
      setTestResult(null)
      setSelectedId(id)
      setViewMode('test')
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取详情失败')
    } finally {
      setViewBusy(false)
    }
  }

  const handleSave = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      await updateAdminPrompt(selectedId, {
        name: editName,
        content: editContent,
        changeNote: editNote || undefined,
      })
      setViewMode('list')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!selectedId || !testContent.trim()) return
    setTestLoading(true)
    setTestResult(null)
    try {
      const r = await testAdminPrompt(selectedId, { testContent: testContent.trim() })
      setTestResult(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : '测试失败')
    } finally {
      setTestLoading(false)
    }
  }

  const handleRollback = async (version: number) => {
    if (!selectedId) return
    const ok = await confirm({
      title: '回滚确认',
      message: `确定回滚到版本 ${version}？当前版本将被保存为历史记录。`,
      confirmLabel: '回滚',
      variant: 'warning',
    })
    if (!ok) return
    try {
      await rollbackAdminPrompt(selectedId, version)
      setViewMode('list')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '回滚失败')
    }
  }

  const toggleEnabled = async (item: AdminPromptListItem) => {
    try {
      await updateAdminPrompt(item.id, { isEnabled: !item.isEnabled })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败')
    }
  }

  // ── List View ──
  if (viewMode === 'list') {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <AdminPageHeader title="AI Prompt 模板" description="在线修改所有 AI 功能的 System Prompt，修改后即时生效" />
        <AdminPageBody>
          {error ? <div className="mb-4"><AdminError message={error} /></div> : null}
          {viewBusy ? (
            <BrandLoading label="打开模板…" minHeight={280} />
          ) : (
          <AdminCard className="overflow-hidden p-0 sm:p-0">
            {loading ? (
              <BrandLoading label="加载模板列表…" minHeight={240} className="rounded-none border-0 shadow-none" />
            ) : items.length === 0 ? (
              <AdminEmpty message="暂无模板" />
            ) : (
              <ul className="divide-y divide-neutral-100">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-neutral-900">
                        {item.name}
                        {item.vipLevel > 0 && (
                          <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">VIP</span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-neutral-400">
                        {PURPOSE_LABELS[item.purpose] ?? item.purpose} · v{item.version}
                        {item.description ? ` · ${item.description}` : ''}
                        {item.updatedBy ? ` · 最后修改: ${item.updatedBy.email}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <AdminGhostButton onClick={() => void toggleEnabled(item)}>
                        {item.isEnabled ? '停用' : '启用'}
                      </AdminGhostButton>
                      <AdminGhostButton onClick={() => void openTest(item.id)}>测试</AdminGhostButton>
                      <AdminGhostButton onClick={() => void openHistory(item.id)}>历史</AdminGhostButton>
                      <AdminPrimaryButton onClick={() => void openEdit(item.id)}>编辑</AdminPrimaryButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
          )}
        </AdminPageBody>
      </div>
    )
  }

  // ── Edit View ──
  if (viewMode === 'edit' && detail) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <AdminPageHeader
          title={`编辑: ${detail.name}`}
          description={`${PURPOSE_LABELS[detail.purpose] ?? detail.purpose} · VIP ${detail.vipLevel} · 当前版本 v${detail.version}`}
          actions={
            <>
              <AdminGhostButton onClick={() => setViewMode('list')}>返回</AdminGhostButton>
              <AdminPrimaryButton onClick={() => void handleSave()} disabled={saving}>
                {saving ? '保存中…' : '保存'}
              </AdminPrimaryButton>
            </>
          }
        />
        <AdminPageBody>
          {error ? <div className="mb-4"><AdminError message={error} /></div> : null}
          <AdminCard className="mb-4">
            <label className="mb-2 block text-xs font-medium text-neutral-500">模板名称</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:bg-white"
            />
          </AdminCard>
          <AdminCard className="mb-4">
            <label className="mb-2 block text-xs font-medium text-neutral-500">Prompt 内容</label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={20}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-sm leading-relaxed outline-none focus:border-neutral-400 focus:bg-white"
            />
          </AdminCard>
          <AdminCard>
            <label className="mb-2 block text-xs font-medium text-neutral-500">修改说明（用于历史版本追溯）</label>
            <input
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="如：优化了语法纠错的示例、新增冠词细分等"
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:bg-white"
            />
          </AdminCard>
        </AdminPageBody>
      </div>
    )
  }

  // ── History View ──
  if (viewMode === 'history') {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <AdminPageHeader
          title="版本历史"
          description="可回滚到任意历史版本"
          actions={<AdminGhostButton onClick={() => setViewMode('list')}>返回</AdminGhostButton>}
        />
        <AdminPageBody>
          {error ? <div className="mb-4"><AdminError message={error} /></div> : null}
          <AdminCard className="overflow-hidden p-0 sm:p-0">
            {historyItems.length === 0 ? (
              <AdminEmpty message="暂无历史版本" />
            ) : (
              <ul className="divide-y divide-neutral-100">
                {historyItems.map((v) => (
                  <li key={v.version} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-neutral-900">版本 {v.version}</p>
                        <p className="mt-1 text-xs text-neutral-400">
                          {v.changeNote ?? '无说明'} · {v.createdAt}
                          {v.createdBy ? ` · ${v.createdBy.email}` : ''}
                        </p>
                      </div>
                      <AdminPrimaryButton onClick={() => void handleRollback(v.version)}>回滚到此版本</AdminPrimaryButton>
                    </div>
                    <pre className="mt-3 max-h-40 overflow-auto rounded border border-neutral-100 bg-neutral-50 p-3 text-xs text-neutral-600">
                      {v.content.slice(0, 500)}{v.content.length > 500 ? '...' : ''}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </AdminPageBody>
      </div>
    )
  }

  // ── Test View ──
  if (viewMode === 'test' && detail) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <AdminPageHeader
          title={`测试: ${detail.name}`}
          description="不保存修改，直接用当前 Prompt 调用一次 AI 预览效果"
          actions={<AdminGhostButton onClick={() => setViewMode('list')}>返回</AdminGhostButton>}
        />
        <AdminPageBody>
          {error ? <div className="mb-4"><AdminError message={error} /></div> : null}
          <AdminCard className="mb-4">
            <label className="mb-2 block text-xs font-medium text-neutral-500">测试内容（模拟用户输入）</label>
            <textarea
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
              rows={6}
              placeholder="输入一段英文文本用于测试 Prompt..."
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:bg-white"
            />
            <div className="mt-3">
              <AdminPrimaryButton onClick={() => void handleTest()} disabled={testLoading || !testContent.trim()}>
                {testLoading ? '测试中…' : '运行测试'}
              </AdminPrimaryButton>
            </div>
          </AdminCard>
          {testResult && (
            <AdminCard>
              <div className="mb-3 flex items-center gap-4 text-xs text-neutral-400">
                <span>Prompt Tokens: {testResult.tokenUsage.promptTokens}</span>
                <span>Completion Tokens: {testResult.tokenUsage.completionTokens}</span>
                <span>Total: {testResult.tokenUsage.totalTokens}</span>
                <span>延迟: {testResult.latencyMs}ms</span>
              </div>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded border border-neutral-100 bg-neutral-50 p-4 text-sm text-neutral-800">
                {testResult.aiResponse}
              </pre>
            </AdminCard>
          )}
        </AdminPageBody>
      </div>
    )
  }

  return null
}
