import { useCallback, useEffect, useState } from 'react'
import {
  createAdminQuote,
  deleteAdminQuote,
  listAdminQuotes,
  updateAdminQuote,
  type AdminQuoteItem,
} from '../../../api/admin'
import {
  AdminCard,
  AdminEmpty,
  AdminError,
  AdminGhostButton,
  AdminPageBody,
  AdminPageHeader,
  AdminPrimaryButton,
} from '../AdminUi'

export function AdminQuotesPage() {
  const [items, setItems] = useState<AdminQuoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('default')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listAdminQuotes()
      setItems(data.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载语录失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleCreate = async () => {
    if (!content.trim()) return
    try {
      await createAdminQuote({ content: content.trim(), category: category.trim() || 'default' })
      setContent('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败')
    }
  }

  const toggleEnabled = async (item: AdminQuoteItem) => {
    try {
      await updateAdminQuote(item.id, { isEnabled: !item.isEnabled })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败')
    }
  }

  const handleEdit = async (item: AdminQuoteItem) => {
    const next = window.prompt('编辑语录内容', item.content)
    if (next === null || !next.trim()) return
    try {
      await updateAdminQuote(item.id, { content: next.trim() })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定删除该语录？')) return
    try {
      await deleteAdminQuote(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader title="励志语录" description="打卡页展示的语录内容" />
      <AdminPageBody>
        {error ? <div className="mb-4"><AdminError message={error} /></div> : null}
        <AdminCard className="mb-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="语录内容"
              className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:bg-white"
            />
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="分类"
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:bg-white sm:w-36"
            />
            <AdminPrimaryButton onClick={() => void handleCreate()}>添加</AdminPrimaryButton>
          </div>
        </AdminCard>
        <AdminCard className="overflow-hidden p-0 sm:p-0">
          {loading ? (
            <AdminEmpty message="加载中…" />
          ) : items.length === 0 ? (
            <AdminEmpty message="暂无语录" />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-4 sm:px-6">
                  <div className="min-w-0">
                    <p className="text-sm text-neutral-800">{item.content}</p>
                    <p className="mt-1 text-xs text-neutral-400">
                      {item.category} · {item.isEnabled ? '启用' : '停用'}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <AdminGhostButton onClick={() => void handleEdit(item)}>编辑</AdminGhostButton>
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
