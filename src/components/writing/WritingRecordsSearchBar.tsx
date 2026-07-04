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
  tab,
  keyword,
  onKeywordChange,
  fields,
  onToggleField,
  onReset,
  onSearch,
  searchEnabled = false,
  compact = false,
}: WritingRecordsSearchBarProps) {
  const tabLabel = tab === 'saves' ? '草稿' : '提交记录'

  return (
    <div
      className={`border-b border-neutral-200 bg-white ${compact ? 'px-3 py-2.5' : 'px-4 py-3 sm:px-5'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-neutral-600">搜索{tabLabel}</p>
        {!searchEnabled && (
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500">
            草稿暂不支持
          </span>
        )}
      </div>

      <div className="relative mt-2">
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
          placeholder={
            searchEnabled ? `在${tabLabel}标题与正文中搜索…` : `切换至提交记录后可搜索`
          }
          disabled={!searchEnabled}
          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-9 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
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
        <>
          <div className="mt-2.5">
            <p className="text-[11px] text-neutral-500">检索范围（提交记录后端按标题+正文检索）</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {SEARCH_FIELD_OPTIONS.map(({ id, label }) => {
                const active = fields.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onToggleField(id)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                      active
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              onClick={onSearch}
              className="flex-1 rounded-lg bg-neutral-900 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              搜索
            </button>
            <button
              type="button"
              onClick={onReset}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              重置
            </button>
          </div>
        </>
      )}
    </div>
  )
}
