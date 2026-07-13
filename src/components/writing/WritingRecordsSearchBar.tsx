import { Search, X } from 'lucide-react'

export type RecordSearchField = 'topic' | 'title' | 'content' | 'time'

export const DEFAULT_RECORD_SEARCH_FIELDS: RecordSearchField[] = [
  'topic',
  'title',
  'content',
  'time',
]

const SEARCH_FIELD_OPTIONS: { id: RecordSearchField; label: string }[] = [
  { id: 'topic', label: '题目' },
  { id: 'title', label: '标题' },
  { id: 'content', label: '内容' },
  { id: 'time', label: '时间' },
]

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
  return (
    <div
      className={`border-b border-neutral-200 bg-white ${compact ? 'px-3 py-2.5' : 'px-4 py-3 sm:px-5'}`}
    >
      {/* Search input row */}
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
            placeholder="搜索标题或正文…"
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
            搜索
          </button>
        )}
      </div>

      {/* Filter row */}
      {searchEnabled && (
        <div className="mt-2.5 flex items-center gap-2.5">
          <span className="shrink-0 text-xs text-neutral-500">检索范围</span>
          <div className="flex">
            {SEARCH_FIELD_OPTIONS.map(({ id, label }, index) => {
              const active = fields.includes(id)
              const isFirst = index === 0
              const isLast = index === SEARCH_FIELD_OPTIONS.length - 1
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
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
