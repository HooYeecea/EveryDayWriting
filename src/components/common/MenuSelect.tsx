import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

export interface MenuSelectOption {
  value: string
  label: string
}

interface MenuSelectProps {
  value: string
  options: MenuSelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
  disabled?: boolean
  className?: string
  buttonClassName?: string
}

/**
 * 与开始写作页「题目类型」同款的自定义下拉：portal 菜单、圆角、无原生 select。
 */
export function MenuSelect({
  value,
  options,
  onChange,
  placeholder = '请选择',
  ariaLabel,
  disabled = false,
  className = '',
  buttonClassName = '',
}: MenuSelectProps) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; minWidth: number } | null>(
    null,
  )
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selected = options.find((option) => option.value === value)

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
      const estimatedHeight = Math.min(menuMaxHeight, options.length * 40 + 8)
      const spaceBelow = window.innerHeight - rect.bottom - gap
      const openUpward = spaceBelow < estimatedHeight && rect.top > spaceBelow
      const top = openUpward
        ? Math.max(8, rect.top - gap - estimatedHeight)
        : rect.bottom + gap

      setMenuPos({
        top,
        left: Math.min(rect.left, window.innerWidth - Math.max(160, rect.width) - 8),
        minWidth: Math.max(160, rect.width),
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

  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  const menu =
    open && menuPos
      ? createPortal(
          <ul
            ref={listRef}
            role="listbox"
            className="fixed z-[400] max-h-60 overflow-y-auto overflow-x-hidden rounded-xl border border-neutral-200 bg-white py-1 font-sans shadow-lg"
            style={{
              top: menuPos.top,
              left: menuPos.left,
              minWidth: menuPos.minWidth,
            }}
          >
            {options.length === 0 ? (
              <li className="px-3 py-2 text-sm text-neutral-400">暂无选项</li>
            ) : (
              options.map((option) => {
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
                        isSelected
                          ? 'bg-neutral-50 font-medium text-neutral-900'
                          : 'text-neutral-600'
                      }`}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected && <Check size={14} className="shrink-0 text-neutral-500" />}
                    </button>
                  </li>
                )
              })
            )}
          </ul>,
          document.body,
        )
      : null

  return (
    <div ref={rootRef} className={`relative w-full ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-sans transition-colors hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span
          className={`min-w-0 truncate ${
            selected ? 'font-medium text-neutral-700' : 'text-neutral-300'
          }`}
        >
          {selected?.label ?? placeholder}
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
