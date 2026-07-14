import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface MenuSelectOption {
  value: string
  label: string
}

interface MenuSelectProps {
  value: string
  onChange: (value: string) => void
  options: MenuSelectOption[]
  ariaLabel?: string
  /** 触发按钮额外 class，默认铺满父级宽度 */
  className?: string
  placeholder?: string
}

/** 与开始写作页 TopicTypeSelect 同款的自定义下拉 */
export function MenuSelect({
  value,
  onChange,
  options,
  ariaLabel = '选择',
  className = '',
  placeholder = '请选择',
}: MenuSelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((item) => item.value === value)

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
        className={`flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50 ${className}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className={selected ? 'font-medium text-neutral-700' : 'text-neutral-300'}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 z-30 mt-1.5 max-h-60 w-full min-w-[120px] overflow-y-auto overflow-x-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {options.map((option) => {
            const isSelected = option.value === value

            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-50 ${
                    isSelected ? 'bg-neutral-50 font-medium text-neutral-900' : 'text-neutral-600'
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check size={14} className="shrink-0 text-neutral-500" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
