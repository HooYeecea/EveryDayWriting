import { Search, X } from 'lucide-react'
import type { WritingSubmitListItem } from '../../types'
import { useT } from '../../i18n'
import type { MessageKey } from '../../i18n'

export type RecordSearchField = 'topic' | 'title' | 'content'

export const DEFAULT_RECORD_SEARCH_FIELDS: RecordSearchField[] = [
  'topic',
  'title',
  'content',
]

const SEARCH_FIELD_LABEL_KEYS: Record<RecordSearchField, MessageKey> = {
  topic: 'records.search.field.topic',
  title: 'records.search.field.title',
  content: 'records.search.field.content',
}

/** 勾选标题/内容时才走服务端 keyword（全文为标题+正文） */
export function needsServerKeyword(
  keyword: string,
  fields: RecordSearchField[],
): boolean {
  const q = keyword.trim()
  if (!q) return false
  return fields.includes('title') || fields.includes('content')
}

/**
 * 按检索范围二次过滤。
 * - 内容：正文不在列表字段中，保留服务端全文结果
 * - 标题：匹配 title
 * - 题目：列表仅有题型 topicType，按题型字符串匹配
 */
export function filterSubmitsBySearchFields(
  items: WritingSubmitListItem[],
  keyword: string,
  fields: RecordSearchField[],
): WritingSubmitListItem[] {
  const q = keyword.trim().toLowerCase()
  if (!q || fields.length === 0) return items

  if (fields.includes('content')) return items

  return items.filter((item) => {
    if (fields.includes('title') && item.title.toLowerCase().includes(q)) return true
    if (fields.includes('topic') && item.topicType.toLowerCase().includes(q)) return true
    return false
  })
}

interface WritingRecordsSearchBarProps {
  tab: 'saves' | 'submits'
  keyword: string
  onKeywordChange: (value: string) => void
  fields: RecordSearchField[]
  onToggleField: (field: RecordSearchField) => void
  onReset: () => void
  onSearch?: () => void
  searchEnabled?: boolean
  compact?: boolean
}

export function WritingRecordsSearchBar({
  keyword,
  onKeywordChange,
  fields,
  onToggleField,
  onSearch,
  searchEnabled = false,
  compact = false,
}: WritingRecordsSearchBarProps) {
  const t = useT()

  const searchFieldOptions: { id: RecordSearchField; labelKey: MessageKey }[] = [
    { id: 'topic', labelKey: SEARCH_FIELD_LABEL_KEYS.topic },
    { id: 'title', labelKey: SEARCH_FIELD_LABEL_KEYS.title },
    { id: 'content', labelKey: SEARCH_FIELD_LABEL_KEYS.content },
  ]

  return (
    <div
      className={`border-b border-neutral-200 bg-white ${compact ? 'px-3 py-2.5' : 'px-4 py-3 sm:px-5'}`}
    >
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="search"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchEnabled) {
                onSearch?.()
              }
            }}
            placeholder={t('records.search.placeholder')}
            disabled={!searchEnabled}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-8 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          />
          {keyword && searchEnabled && (
            <button
              type="button"
              onClick={() => onKeywordChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-400 hover:bg-neutral-200/80 hover:text-neutral-600"
              aria-label="清空关键字"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {searchEnabled && (
          <button
            type="button"
            onClick={onSearch}
            className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {t('records.search.button')}
          </button>
        )}
      </div>

      {searchEnabled && (
        <div className="mt-2.5 flex items-center gap-2.5">
          <span className="shrink-0 text-xs text-neutral-500">{t('records.search.scopeLabel')}</span>
          <div className="flex">
            {searchFieldOptions.map(({ id, labelKey }, index) => {
              const active = fields.includes(id)
              const isFirst = index === 0
              const isLast = index === searchFieldOptions.length - 1
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onToggleField(id)}
                  className={`border px-2.5 py-1 text-xs transition-colors ${
                    isFirst ? 'rounded-l-full' : 'rounded-none -ml-px'
                  } ${
                    isLast ? 'rounded-r-full' : ''
                  } ${
                    active
                      ? 'border-neutral-900 bg-neutral-900 text-white font-medium'
                      : 'border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  {t(labelKey)}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
