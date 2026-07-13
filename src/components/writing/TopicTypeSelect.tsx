import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { getTopicTypes, TOPIC_TYPE_FILTER_OPTIONS, type TopicTypeItem } from '../../api/topics'

interface TopicTypeOption {
  value: string
  label: string
}

interface TopicTypeSelectProps {
  value?: string
  onChange: (value: string | undefined) => void
}

function buildOptions(types: TopicTypeItem[]): TopicTypeOption[] {
  return [
    { value: 'all', label: '全部' },
    ...types.map((item) => ({ value: item.name, label: item.name })),
  ]
}

export function TopicTypeSelect({ value, onChange }: TopicTypeSelectProps) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<TopicTypeOption[]>(
    TOPIC_TYPE_FILTER_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  )
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    getTopicTypes()
      .then((types) => {
        if (cancelled || types.length === 0) return
        setOptions(buildOptions(types))
      })
      .catch((err) => {
        console.warn('[TopicTypeSelect] 拉取题目类型失败，使用本地兜底选项', err)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!open) return

    const onDocumentClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onDocumentClick)
    return () => document.removeEventListener('mousedown', onDocumentClick)
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 min-w-[92px] items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="题目类型筛选"
      >
        <span className={value ? 'font-medium text-neutral-700' : 'text-neutral-300'}>
          {value ?? '类型'}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-20 mt-1.5 min-w-[120px] overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {options.map((option) => {
            const selected = option.value === 'all' ? !value : value === option.value

            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(option.value === 'all' ? undefined : option.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-50 ${
                    selected ? 'bg-neutral-50 font-medium text-neutral-900' : 'text-neutral-600'
                  }`}
                >
                  <span>{option.label}</span>
                  {selected && <Check size={14} className="shrink-0 text-neutral-500" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
