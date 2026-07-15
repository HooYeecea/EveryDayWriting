import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal } from 'lucide-react'

export interface AdminActionMenuItem {
  id: string
  label: string
  onClick: () => void
  disabled?: boolean
  tone?: 'default' | 'danger'
}

interface AdminActionMenuProps {
  items: AdminActionMenuItem[]
  label?: string
}

export function AdminActionMenu({ items, label = '更多操作' }: AdminActionMenuProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const visibleItems = items.filter(Boolean)

  useLayoutEffect(() => {
    if (!open) {
      setPos(null)
      return
    }

    const update = () => {
      const button = buttonRef.current
      if (!button) return
      const rect = button.getBoundingClientRect()
      const menuWidth = 148
      const left = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)
      const spaceBelow = window.innerHeight - rect.bottom - 8
      const openUp = spaceBelow < 160 && rect.top > spaceBelow
      const top = openUp ? Math.max(8, rect.top - 8 - Math.min(220, visibleItems.length * 40 + 8)) : rect.bottom + 6
      setPos({ top, left: Math.max(8, left) })
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, visibleItems.length])

  useEffect(() => {
    if (!open) return

    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (visibleItems.length === 0) return null

  const menu: ReactNode =
    open && pos
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[80] min-w-[9rem] overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
            style={{ top: pos.top, left: pos.left }}
          >
            {visibleItems.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false)
                  item.onClick()
                }}
                className={`flex w-full px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-50 disabled:opacity-50 ${
                  item.tone === 'danger' ? 'text-red-600' : 'text-neutral-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-800"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        title={label}
      >
        <MoreHorizontal size={16} />
      </button>
      {menu}
    </>
  )
}
