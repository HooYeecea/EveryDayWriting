import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import {
  countUnreadAnnouncements,
  getAnnouncements,
  markAnnouncementRead,
} from '../../api/announcements'
import type { AnnouncementItem } from '../../types'

const PRIORITY_LABELS: Record<string, string> = {
  Urgent: '紧急',
  Important: '重要',
  Normal: '普通',
}

export function AnnouncementsPanel() {
  const [items, setItems] = useState<AnnouncementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    getAnnouncements()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : '加载公告失败'))
      .finally(() => setLoading(false))
  }, [])

  const unreadCount = countUnreadAnnouncements(items)

  const handleOpen = async (item: AnnouncementItem) => {
    setExpandedId((current) => (current === item.id ? null : item.id))
    if (item.hasRead) return

    try {
      await markAnnouncementRead(item.id)
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, hasRead: true } : row)),
      )
    } catch {
      // 展开内容不受影响
    }
  }

  return (
    <section id="announcements" className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-neutral-500" />
          <h3 className="text-sm font-medium text-neutral-900">系统公告</h3>
        </div>
        {unreadCount > 0 && (
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
            {unreadCount} 条未读
          </span>
        )}
      </div>

      {loading && <p className="mt-4 text-sm text-neutral-400">加载中…</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="mt-4 text-sm text-neutral-400">暂无公告</p>
      )}

      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-neutral-100 bg-neutral-50">
            <button
              type="button"
              onClick={() => void handleOpen(item)}
              className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {!item.hasRead && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" aria-hidden />
                  )}
                  <span className="font-medium text-neutral-900">{item.title}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-neutral-500">
                    {PRIORITY_LABELS[item.priority] ?? item.priority}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-400">
                  {new Date(item.publishedAt).toLocaleString('zh-CN')}
                </p>
              </div>
            </button>
            {expandedId === item.id && (
              <div className="border-t border-neutral-100 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-neutral-700">
                {item.content}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
