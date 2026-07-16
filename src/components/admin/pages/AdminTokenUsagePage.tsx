import { useCallback, useEffect, useState } from 'react'
import { listAdminTokenUsage, type AdminTokenUsageItem } from '../../../api/admin'
import {
  AdminCard,
  AdminEmpty,
  AdminError,
  AdminGhostButton,
  AdminPageBody,
  AdminPageHeader,
} from '../AdminUi'
import { useReportReady } from '../../../hooks/useReportReady'

export function AdminTokenUsagePage({ onReady }: { onReady?: () => void } = {}) {
  const [items, setItems] = useState<AdminTokenUsageItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalTokens, setTotalTokens] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listAdminTokenUsage({ page, pageSize: 20 })
      setItems(data.items)
      setTotalPages(data.totalPages || 1)
      setTotalTokens(data.totalTokens)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载用量失败')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void load()
  }, [load])

  useReportReady(!loading, onReady)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader
        title="Token 用量"
        description={`全局合计 ${totalTokens.toLocaleString()} tokens`}
      />
      <AdminPageBody>
        {error ? <div className="mb-4"><AdminError message={error} /></div> : null}
        <AdminCard className="overflow-hidden p-0 sm:p-0">
          {loading ? (
            <AdminEmpty message="加载中…" />
          ) : items.length === 0 ? (
            <AdminEmpty message="暂无用量记录" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">用户</th>
                    <th className="px-4 py-3 font-medium">模型</th>
                    <th className="px-4 py-3 font-medium">用途</th>
                    <th className="px-4 py-3 font-medium">Tokens</th>
                    <th className="px-4 py-3 font-medium">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-neutral-100 last:border-0">
                      <td className="px-4 py-3 text-neutral-700">{item.userEmail}</td>
                      <td className="px-4 py-3 text-xs text-neutral-500">
                        {item.providerId}/{item.modelId}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{item.purpose}</td>
                      <td className="px-4 py-3 font-medium text-neutral-900">
                        {item.totalTokens.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-400">
                        {new Date(item.createdAt).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>
        <div className="mt-4 flex items-center justify-between text-xs text-neutral-400">
          <span>
            第 {page} / {totalPages} 页
          </span>
          <div className="flex gap-2">
            <AdminGhostButton disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              上一页
            </AdminGhostButton>
            <AdminGhostButton
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              下一页
            </AdminGhostButton>
          </div>
        </div>
      </AdminPageBody>
    </div>
  )
}
