import { useCallback, useEffect, useState } from 'react'
import { listAdminAuditLogs, type AdminAuditLogItem } from '../../../api/admin'
import {
  AdminCard,
  AdminEmpty,
  AdminError,
  AdminGhostButton,
  AdminPageBody,
  AdminPageHeader,
} from '../AdminUi'

export function AdminAuditLogsPage() {
  const [items, setItems] = useState<AdminAuditLogItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listAdminAuditLogs({ page, pageSize: 20 })
      setItems(data.items)
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载审计日志失败')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader title="操作审计" description="管理员关键操作记录" />
      <AdminPageBody>
        {error ? <div className="mb-4"><AdminError message={error} /></div> : null}
        <AdminCard className="overflow-hidden p-0 sm:p-0">
          {loading ? (
            <AdminEmpty message="加载中…" />
          ) : items.length === 0 ? (
            <AdminEmpty message="暂无审计记录" />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {items.map((item) => (
                <li key={item.id} className="px-4 py-4 sm:px-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                      {item.action}
                    </span>
                    <span className="text-sm text-neutral-800">{item.adminUser?.email}</span>
                  </div>
                  <p className="mt-2 break-all font-mono text-xs text-neutral-400">{item.details}</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {new Date(item.createdAt).toLocaleString('zh-CN')} · {item.ipAddress}
                  </p>
                </li>
              ))}
            </ul>
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
