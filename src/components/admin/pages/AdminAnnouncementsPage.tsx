import { useCallback, useEffect, useState } from 'react'
import {
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  listAdminAnnouncements,
  updateAdminAnnouncement,
  type AdminAnnouncementListItem,
} from '../../../api/admin'
import {
  AdminCard,
  AdminEmpty,
  AdminError,
  AdminField,
  AdminGhostButton,
  AdminModal,
  AdminPageBody,
  AdminPageHeader,
  AdminPrimaryButton,
  adminInputClass,
} from '../AdminUi'

const CONTENT_CACHE_KEY = 'ew_admin_announcement_content'

function readContentCache(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(CONTENT_CACHE_KEY) || '{}') as Record<string, string>
  } catch {
    return {}
  }
}

function writeContentCache(cache: Record<string, string>) {
  localStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(cache))
}

export function AdminAnnouncementsPage() {
  const [items, setItems] = useState<AdminAnnouncementListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminAnnouncementListItem | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState('Normal')
  const [isPublished, setIsPublished] = useState(true)
  const [expiresAt, setExpiresAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listAdminAnnouncements({ page: 1, pageSize: 50 })
      setItems(data.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载公告失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setTitle('')
    setContent('')
    setPriority('Normal')
    setIsPublished(true)
    setExpiresAt('')
    setFormOpen(true)
  }

  const openEdit = (item: AdminAnnouncementListItem) => {
    const cache = readContentCache()
    setEditing(item)
    setTitle(item.title)
    setContent(cache[item.id] || '')
    setPriority(item.priority || 'Normal')
    setIsPublished(item.isPublished)
    setExpiresAt(item.expiresAt ? item.expiresAt.slice(0, 16) : '')
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setError('标题不能为空')
      return
    }
    if (!editing && !content.trim()) {
      setError('新建公告时内容不能为空')
      return
    }
    if (editing && !content.trim() && !readContentCache()[editing.id]) {
      // 允许只改状态时不传正文（后端会保留原文）
    }

    setSaving(true)
    setError('')
    const body = {
      title: title.trim(),
      content: content.trim(),
      priority,
      isPublished,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    }
    try {
      if (editing) {
        await updateAdminAnnouncement(editing.id, body)
        if (body.content) {
          const cache = readContentCache()
          cache[editing.id] = body.content
          writeContentCache(cache)
        }
      } else {
        const created = await createAdminAnnouncement(body)
        const cache = readContentCache()
        cache[created.id] = body.content
        writeContentCache(cache)
      }
      setFormOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePublish = async (item: AdminAnnouncementListItem) => {
    setBusyId(item.id)
    setError('')
    try {
      const cache = readContentCache()
      await updateAdminAnnouncement(item.id, {
        title: item.title,
        content: cache[item.id] || '',
        priority: item.priority,
        isPublished: !item.isPublished,
        expiresAt: item.expiresAt,
      })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新发布状态失败')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定删除该公告？')) return
    try {
      await deleteAdminAnnouncement(id)
      const cache = readContentCache()
      delete cache[id]
      writeContentCache(cache)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader
        title="公告管理"
        description="创建、编辑、发布与删除系统公告"
        actions={<AdminPrimaryButton onClick={openCreate}>新建公告</AdminPrimaryButton>}
      />
      <AdminPageBody>
        {error ? (
          <div className="mb-4">
            <AdminError message={error} />
          </div>
        ) : null}

        <AdminCard className="overflow-hidden p-0 sm:p-0">
          {loading ? (
            <AdminEmpty message="加载中…" />
          ) : items.length === 0 ? (
            <AdminEmpty message="暂无公告" />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 px-4 py-4 sm:px-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-neutral-900">{item.title}</p>
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">
                        {item.priority}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] ${
                          item.isPublished
                            ? 'bg-neutral-900 text-white'
                            : 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        {item.isPublished ? '已发布' : '草稿'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-400">
                      创建于 {new Date(item.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <AdminPrimaryButton
                      disabled={busyId === item.id}
                      onClick={() => void handleTogglePublish(item)}
                    >
                      {item.isPublished ? '下架' : '发布'}
                    </AdminPrimaryButton>
                    <AdminGhostButton onClick={() => openEdit(item)}>编辑</AdminGhostButton>
                    <AdminGhostButton onClick={() => void handleDelete(item.id)}>删除</AdminGhostButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </AdminPageBody>

      <AdminModal
        open={formOpen}
        title={editing ? '编辑公告' : '新建公告'}
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <AdminGhostButton onClick={() => setFormOpen(false)}>取消</AdminGhostButton>
            <AdminPrimaryButton disabled={saving} onClick={() => void handleSave()}>
              {saving ? '保存中…' : isPublished ? '保存并发布' : '保存为草稿'}
            </AdminPrimaryButton>
          </>
        }
      >
        <div className="space-y-3">
          <AdminField label="标题">
            <input className={adminInputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </AdminField>
          <AdminField label="内容">
            <textarea
              className={adminInputClass}
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                editing
                  ? '列表接口不含正文；不改内容可留空，改发布状态也会保留原文'
                  : '公告正文'
              }
            />
          </AdminField>
          <AdminField label="优先级">
            <select
              className={adminInputClass}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="Normal">普通</option>
              <option value="Important">重要</option>
              <option value="Urgent">紧急</option>
            </select>
          </AdminField>
          <AdminField label="过期时间（可选）">
            <input
              type="datetime-local"
              className={adminInputClass}
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </AdminField>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            发布后用户可见
          </label>
        </div>
      </AdminModal>
    </div>
  )
}
