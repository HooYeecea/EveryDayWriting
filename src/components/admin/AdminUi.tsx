import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { PANEL_SUBTITLE_CLASS, PANEL_TITLE_CLASS } from '../layout/layoutConstants'

interface AdminPageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 py-3 sm:min-h-[5.5rem] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-0">
        <div className="min-w-0">
          <h2 className={PANEL_TITLE_CLASS}>{title}</h2>
          {description ? (
            <p className={`${PANEL_SUBTITLE_CLASS} whitespace-normal sm:truncate`}>{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:max-w-[60%] sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function AdminPageBody({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">{children}</div>
    </div>
  )
}

export function AdminCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6 ${className}`}>
      {children}
    </div>
  )
}

export function AdminEmpty({ message }: { message: string }) {
  return <p className="py-8 text-center text-sm text-neutral-400">{message}</p>
}

export function AdminError({ message }: { message: string }) {
  return <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{message}</p>
}

export function AdminPrimaryButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium tracking-wide text-white hover:bg-neutral-800 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

export function AdminGhostButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

export function AdminField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-sans text-xs font-semibold tracking-wide text-neutral-500 uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}

export const adminInputClass =
  'w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:bg-white'

const MODAL_DEFAULT_SIZE = {
  md: { width: 512, height: 560 },
  lg: { width: 672, height: 640 },
} as const

const MODAL_MIN_WIDTH = 320
const MODAL_MIN_HEIGHT = 300

export function AdminModal({
  open,
  title,
  onClose,
  children,
  footer,
  size = 'md',
  /** 右下角拖拽缩放；仅需要可拉大缩小的弹窗开启 */
  resizable = false,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
  resizable?: boolean
}) {
  const defaults = MODAL_DEFAULT_SIZE[size]
  const [box, setBox] = useState<{ width: number; height: number }>({
    width: defaults.width,
    height: defaults.height,
  })
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    startW: number
    startH: number
  } | null>(null)

  useEffect(() => {
    if (!open) return
    const width = Math.min(defaults.width, Math.max(MODAL_MIN_WIDTH, window.innerWidth - 32))
    const height = Math.min(defaults.height, Math.max(MODAL_MIN_HEIGHT, window.innerHeight * 0.9))
    setBox({ width, height })
  }, [open, defaults.height, defaults.width])

  if (!open) return null

  const onResizePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!resizable) return
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startW: box.width,
      startH: box.height,
    }
  }

  const onResizePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const maxW = window.innerWidth - 24
    const maxH = window.innerHeight * 0.92
    setBox({
      width: Math.min(maxW, Math.max(MODAL_MIN_WIDTH, drag.startW + (event.clientX - drag.startX))),
      height: Math.min(maxH, Math.max(MODAL_MIN_HEIGHT, drag.startH + (event.clientY - drag.startY))),
    })
  }

  const onResizePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null
    }
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // ignore
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="关闭弹层"
        onClick={onClose}
      />
      <div
        className={`relative z-10 flex w-full flex-col rounded-t-2xl border border-neutral-200 bg-white shadow-xl sm:rounded-2xl ${
          resizable ? '' : size === 'lg' ? 'max-h-[90vh] max-w-2xl' : 'max-h-[90vh] max-w-lg'
        }`}
        style={
          resizable
            ? {
                width: box.width,
                height: box.height,
                maxWidth: 'calc(100vw - 1.5rem)',
                maxHeight: '92vh',
              }
            : undefined
        }
      >
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h3 className="font-sans text-sm font-semibold text-neutral-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer ? (
          <div className="flex shrink-0 justify-end gap-2 border-t border-neutral-200 px-4 py-3">{footer}</div>
        ) : null}
        {resizable ? (
          <button
            type="button"
            aria-label="拖拽调整弹窗大小"
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            onPointerCancel={onResizePointerUp}
            className="absolute bottom-1 right-1 hidden h-5 w-5 cursor-se-resize touch-none sm:block"
          >
            <span
              aria-hidden
              className="absolute bottom-1.5 right-1.5 h-2.5 w-2.5 border-r-2 border-b-2 border-neutral-300"
            />
          </button>
        ) : null}
      </div>
    </div>
  )
}
