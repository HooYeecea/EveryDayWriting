import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import { getTopicTypes, TOPIC_TYPE_FILTER_OPTIONS, type TopicTypeItem } from '../../api/topics'

interface TopicTypeOption {
  value: string
  label: string
}

interface TopicTypeSelectProps {
  value?: string
  onChange: (value: string | undefined) => void
  /** 触发按钮额外 class */
  className?: string
  /** 外层容器额外 class，桌面端竖排时用 sm:w-full 对齐 */
  rootClassName?: string
  disabled?: boolean
}

function buildOptions(types: TopicTypeItem[]): TopicTypeOption[] {
  return [
    { value: 'all', label: '全部' },
    ...types.map((item) => ({ value: item.name, label: item.name })),
  ]
}

export function TopicTypeSelect({
  value,
  onChange,
  className = '',
  rootClassName = '',
  disabled = false,
}: TopicTypeSelectProps) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; minWidth: number } | null>(
    null,
  )
  const [options, setOptions] = useState<TopicTypeOption[]>(
    TOPIC_TYPE_FILTER_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  )
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

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

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null)
      return
    }

    const updatePosition = () => {
      const button = buttonRef.current
      if (!button) return
      const rect = button.getBoundingClientRect()
      const menuMaxHeight = 240
      const gap = 6
      const spaceBelow = window.innerHeight - rect.bottom - gap
      const openUpward = spaceBelow < Math.min(menuMaxHeight, options.length * 40) && rect.top > spaceBelow
      const top = openUpward
        ? Math.max(8, rect.top - gap - Math.min(menuMaxHeight, options.length * 40 + 8))
        : rect.bottom + gap

      setMenuPos({
        top,
        left: Math.min(rect.left, window.innerWidth - Math.max(120, rect.width) - 8),
        minWidth: Math.max(120, rect.width),
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, options.length])

  useEffect(() => {
    if (!open) return

    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return
      setOpen(false)
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

  const menu =
    open && menuPos
      ? createPortal(
          <ul
            ref={listRef}
            role="listbox"
            className="fixed z-[80] max-h-60 overflow-y-auto overflow-x-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
            style={{
              top: menuPos.top,
              left: menuPos.left,
              minWidth: menuPos.minWidth,
            }}
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
          </ul>,
          document.body,
        )
      : null

  return (
    <div ref={rootRef} className={`relative shrink-0 ${rootClassName}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return
          setOpen((current) => !current)
        }}
        className={`flex h-9 w-[5.75rem] items-center justify-between gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-neutral-200 disabled:hover:bg-white sm:w-auto sm:min-w-[92px] sm:gap-2 sm:px-3 ${className}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="题目类型筛选"
        title={disabled ? '当前草稿题目已锁定' : undefined}
      >
        <span className={`truncate ${value ? 'font-medium text-neutral-700' : 'text-neutral-300'}`}>
          {value ?? '类型'}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {menu}
    </div>
  )
}
