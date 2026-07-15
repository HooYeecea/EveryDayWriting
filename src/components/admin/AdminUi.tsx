import type { ReactNode } from 'react'
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
      <div className="mx-auto flex min-h-[5.25rem] max-w-6xl items-center justify-between gap-4 sm:min-h-[5.5rem]">
        <div className="min-w-0">
          <h2 className={PANEL_TITLE_CLASS}>{title}</h2>
          {description ? <p className={`${PANEL_SUBTITLE_CLASS} truncate`}>{description}</p> : null}
        </div>
        {actions ? <div className="flex max-w-[55%] shrink-0 items-center justify-end gap-2 overflow-x-auto">{actions}</div> : null}
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

export function AdminModal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="关闭弹层"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl border border-neutral-200 bg-white shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
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
        <div className="overflow-y-auto px-4 py-4">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-neutral-200 px-4 py-3">{footer}</div>
        ) : null}
      </div>
    </div>
  )
}
