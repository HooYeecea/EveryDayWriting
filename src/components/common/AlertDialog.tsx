import { Bell, Info, X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { useT } from '../../i18n'

export type AppAlertVariant = 'default' | 'info' | 'notice'

export interface AppAlertOptions {
  title: string
  message: ReactNode
  confirmLabel?: string
  variant?: AppAlertVariant
}

interface AlertDialogProps extends AppAlertOptions {
  open: boolean
  onClose: () => void
}

export function AlertDialog({
  open,
  title,
  message,
  confirmLabel,
  variant = 'default',
  onClose,
}: AlertDialogProps) {
  const t = useT()
  const resolvedConfirm = confirmLabel ?? t('common.gotIt')

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const Icon = variant === 'notice' ? Bell : Info
  const iconWrap =
    variant === 'notice' ? 'bg-amber-50 text-amber-600' : 'bg-neutral-100 text-neutral-500'

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="app-alert-title"
        className="animate-scale-in relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          aria-label={t('common.close')}
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 pr-6">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconWrap}`}
          >
            <Icon size={18} />
          </div>
          <h2 id="app-alert-title" className="text-lg font-semibold text-neutral-900">
            {title}
          </h2>
        </div>

        <div className="mt-4 text-sm leading-relaxed text-neutral-500">{message}</div>

        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            {resolvedConfirm}
          </button>
        </div>
      </div>
    </div>
  )
}
