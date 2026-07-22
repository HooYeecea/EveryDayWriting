import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown, Loader2 } from 'lucide-react'
import {
  countUnreadAnnouncements,
  getAnnouncements,
  markAnnouncementRead,
} from '../../api/announcements'
import { useT } from '../../i18n'
import type { AnnouncementItem } from '../../types'

export function AnnouncementsPanel({ onReady }: { onReady?: () => void } = {}) {
  const t = useT()
  const [items, setItems] = useState<AnnouncementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const reportedRef = useRef(false)

  const priorityLabel = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return t('announce.priority.urgent')
      case 'Important':
        return t('announce.priority.important')
      case 'Normal':
        return t('announce.priority.normal')
      default:
        return priority
    }
  }

  useEffect(() => {
    getAnnouncements()
      .then(setItems)
      .catch((err) =>
        setError(err instanceof Error ? err.message : t('announce.loadFailed')),
      )
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => {
    if (loading || reportedRef.current) return
    reportedRef.current = true
    onReady?.()
  }, [loading, onReady])

  const unreadCount = countUnreadAnnouncements(items)

  const toggleExpand = async (item: AnnouncementItem) => {
    const willExpand = !expandedIds.has(item.id)
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(item.id)) next.delete(item.id)
      else next.add(item.id)
      return next
    })

    if (!willExpand || item.hasRead) return

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
    <section id="announcements" className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-neutral-500" />
          <h3 className="text-sm font-medium text-neutral-900">{t('announce.title')}</h3>
        </div>
        {unreadCount > 0 && (
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
            {t('announce.unreadCount', { n: unreadCount })}
          </span>
        )}
      </div>

      {loading && (
        <div
          className="mt-4 flex min-h-[140px] flex-col items-center justify-center gap-2 text-sm text-neutral-400"
          role="status"
        >
          <Loader2 size={18} className="animate-spin text-neutral-300" />
          {t('announce.loading')}
        </div>
      )}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="mt-4 text-sm text-neutral-400">{t('announce.empty')}</p>
      )}

      {!loading && (
      <ul className="mt-4 space-y-3">
        {items.map((item) => {
          const expanded = expandedIds.has(item.id)

          return (
            <li key={item.id} className="rounded-xl border border-neutral-100 bg-neutral-50">
              <button
                type="button"
                onClick={() => void toggleExpand(item)}
                aria-expanded={expanded}
                className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {!item.hasRead && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" aria-hidden />
                    )}
                    <span className="font-medium text-neutral-900">{item.title}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-neutral-500">
                      {priorityLabel(item.priority)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-400">
                    {new Date(item.publishedAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-400"
                  aria-hidden
                >
                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                  />
                </span>
                <span className="sr-only">
                  {expanded ? t('announce.collapse') : t('announce.expand')}
                </span>
              </button>
              {expanded && (
                <div className="border-t border-neutral-100 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-neutral-700">
                  {item.content}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      )}
    </section>
  )
}
