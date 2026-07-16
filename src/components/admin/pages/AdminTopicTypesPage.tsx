import { useCallback, useEffect, useState } from 'react'
import {
  createAdminTopicType,
  deleteAdminTopicType,
  listAdminTopicTypes,
  updateAdminTopicType,
  type AdminTopicTypeItem,
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

export function AdminTopicTypesPage({ onReady }: { onReady?: () => void } = {}) {
  const { confirm } = useAppConfirm()
  const [items, setItems] = useState<AdminTopicTypeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listAdminTopicTypes()
      setItems(data.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载题目类型失败')
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
      await createAdminTopicType({
        name: name.trim(),
        description: description.trim() || undefined,
        sortOrder: items.length + 1,
        isEnabled: true,
      })
      setName('')
      setDescription('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败')
    }
  }

  const toggleEnabled = async (item: AdminTopicTypeItem) => {
    try {
      await updateAdminTopicType(item.id, {
        name: item.name,
        description: item.description ?? undefined,
        sortOrder: item.sortOrder,
        isEnabled: !item.isEnabled,
      })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败')
    }
  }

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: '删除题目类型',
      message: '确定删除该题目类型？此操作不可恢复。',
      confirmLabel: '删除',
      variant: 'warning',
    })
    if (!ok) return
    try {
      await deleteAdminTopicType(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader title="题目类型" description="CET / IELTS / 考研等分类" />
      <AdminPageBody>
        {error ? <div className="mb-4"><AdminError message={error} /></div> : null}
        <AdminCard className="mb-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="类型名称"
              className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:bg-white"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述（可选）"
              className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:bg-white"
            />
            <AdminPrimaryButton onClick={() => void handleCreate()}>添加</AdminPrimaryButton>
          </div>
        </AdminCard>
        <AdminCard className="overflow-hidden p-0 sm:p-0">
          {loading ? (
            <AdminEmpty message="加载中…" />
          ) : items.length === 0 ? (
            <AdminEmpty message="暂无类型" />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
                  <div>
                    <p className="font-medium text-neutral-900">{item.name}</p>
                    <p className="mt-1 text-xs text-neutral-400">
                      {item.description || '无描述'} · {item.topicCount} 题 ·{' '}
                      {item.isEnabled ? '启用' : '停用'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <AdminGhostButton onClick={() => void toggleEnabled(item)}>
                      {item.isEnabled ? '停用' : '启用'}
                    </AdminGhostButton>
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
