import { useCallback, useEffect, useState } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import {
  createAdminCheckInTier,
  deleteAdminCheckInTier,
  listAdminCheckInTiers,
  reorderAdminCheckInTiers,
  updateAdminCheckInTier,
  type AdminCheckInTierItem,
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
import { useReportReady } from '../../../hooks/useReportReady'

export function AdminCheckInTiersPage({ onReady }: { onReady?: () => void } = {}) {
  const { confirm } = useAppConfirm()
  const [items, setItems] = useState<AdminCheckInTierItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [minDays, setMinDays] = useState('0')
  const [reordering, setReordering] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listAdminCheckInTiers()
      setItems([...data.items].sort((a, b) => a.sortOrder - b.sortOrder))
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载段位失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useReportReady(!loading, onReady)

  const handleCreate = async () => {
    if (!name.trim()) return
    try {
      await createAdminCheckInTier({
        name: name.trim(),
        minDays: Number(minDays) || 0,
        sortOrder: items.length + 1,
      })
      setName('')
      setMinDays('0')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败')
    }
  }

  const handleEdit = async (item: AdminCheckInTierItem) => {
    const nextName = window.prompt('段位名称', item.name)
    if (nextName === null) return
    const nextMin = window.prompt('最少天数', String(item.minDays))
    if (nextMin === null) return
    const nextIcon = window.prompt('图标 URL（可空）', item.iconUrl || '')
    if (nextIcon === null) return
    try {
      await updateAdminCheckInTier(item.id, {
        name: nextName.trim() || item.name,
        minDays: Number(nextMin) || 0,
        iconUrl: nextIcon,
        sortOrder: item.sortOrder,
      })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败')
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: '删除段位',
      message: '确定删除该段位？此操作不可恢复。',
      confirmLabel: '删除',
      variant: 'warning',
    })
    if (!ok) return
    try {
      await deleteAdminCheckInTier(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    }
  }

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const next = [...items]
    const tmp = next[index]
    next[index] = next[target]
    next[target] = tmp
    setItems(next)
    setReordering(true)
    setError('')
    try {
      await reorderAdminCheckInTiers(next.map((item) => item.id))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '排序失败')
      await load()
    } finally {
      setReordering(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader title="签到段位" description="按连续打卡天数配置段位，支持上下排序" />
      <AdminPageBody>
        {error ? (
          <div className="mb-4">
            <AdminError message={error} />
          </div>
        ) : null}
        <AdminCard className="mb-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="段位名称"
              className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:bg-white"
            />
            <input
              value={minDays}
              onChange={(e) => setMinDays(e.target.value)}
              placeholder="最少天数"
              type="number"
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:bg-white sm:w-32"
            />
            <AdminPrimaryButton onClick={() => void handleCreate()}>添加</AdminPrimaryButton>
          </div>
        </AdminCard>
        <AdminCard className="overflow-hidden p-0 sm:p-0">
          {loading ? (
            <AdminEmpty message="加载中…" />
          ) : items.length === 0 ? (
            <AdminEmpty message="暂无段位" />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {items.map((item, index) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
                  <div>
                    <p className="font-medium text-neutral-900">{item.name}</p>
                    <p className="mt-1 text-xs text-neutral-400">
                      ≥ {item.minDays} 天 · 排序 {item.sortOrder}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AdminGhostButton
                      disabled={reordering || index === 0}
                      onClick={() => void move(index, -1)}
                      aria-label="上移"
                    >
                      <ArrowUp size={14} />
                    </AdminGhostButton>
                    <AdminGhostButton
                      disabled={reordering || index === items.length - 1}
                      onClick={() => void move(index, 1)}
                      aria-label="下移"
                    >
                      <ArrowDown size={14} />
                    </AdminGhostButton>
                    <AdminGhostButton onClick={() => void handleEdit(item)}>编辑</AdminGhostButton>
                    <AdminGhostButton onClick={() => void handleDelete(item.id)}>删除</AdminGhostButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </AdminPageBody>
    </div>
  )
}
