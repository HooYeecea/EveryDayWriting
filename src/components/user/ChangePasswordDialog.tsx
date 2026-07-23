import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { KeyRound, X } from 'lucide-react'
import { changePassword } from '../../api/auth'
import { isApiError } from '../../api/request'
import { useAppAlert } from '../../context/AppAlertContext'
import { useT } from '../../i18n'
import { PASSWORD_FIELD_HINT_KEY, validatePassword } from '../../utils/authValidation'

interface ChangePasswordDialogProps {
  open: boolean
  onClose: () => void
}

export function ChangePasswordDialog({ open, onClose }: ChangePasswordDialogProps) {
  const t = useT()
  const { alert } = useAppAlert()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSubmitting(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, submitting, onClose])

  if (!open) return null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    if (!oldPassword) {
      setError(t('userCenter.changePassword.needOld'))
      return
    }
    if (!newPassword) {
      setError(t('userCenter.changePassword.needNew'))
      return
    }
    if (!confirmPassword) {
      setError(t('userCenter.changePassword.needConfirm'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.common.passwordMismatch'))
      return
    }
    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setError(t(passwordError))
      return
    }
    if (oldPassword === newPassword) {
      setError(t('userCenter.changePassword.sameAsOld'))
      return
    }

    setSubmitting(true)
    try {
      await changePassword(oldPassword, newPassword)
      onClose()
      await alert({
        title: t('userCenter.changePassword.title'),
        message: t('userCenter.changePassword.success'),
      })
    } catch (err) {
      const message =
        isApiError(err) || err instanceof Error
          ? err.message
          : t('userCenter.changePassword.failed')
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 px-0 sm:items-center sm:px-4"
      onClick={() => {
        if (!submitting) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        className="relative w-full max-w-md rounded-t-2xl border border-neutral-200 bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => {
            if (!submitting) onClose()
          }}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 sm:right-4 sm:top-4"
          aria-label={t('common.close')}
          disabled={submitting}
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100">
            <KeyRound size={18} className="text-neutral-600" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h2
              id="change-password-title"
              className="text-base font-semibold text-neutral-900 sm:text-lg"
            >
              {t('userCenter.changePassword.title')}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500 sm:text-sm">
              {t('userCenter.changePassword.desc')}
            </p>
          </div>
        </div>

        <form noValidate onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-3.5">
          <div>
            <label className="mb-1.5 block font-sans text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
              {t('userCenter.changePassword.old')}
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              autoComplete="current-password"
              disabled={submitting}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-neutral-400 focus:bg-white disabled:opacity-60"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
              {t('userCenter.changePassword.new')}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              disabled={submitting}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-neutral-400 focus:bg-white disabled:opacity-60"
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-400">
              {t(PASSWORD_FIELD_HINT_KEY)}
            </p>
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
              {t('userCenter.changePassword.confirm')}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              disabled={submitting}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-neutral-400 focus:bg-white disabled:opacity-60"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {submitting
                ? t('userCenter.changePassword.submitting')
                : t('userCenter.changePassword.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
