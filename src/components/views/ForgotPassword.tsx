import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { isApiError } from '../../api/request'
import { sendEmailCode, resetPassword } from '../../api/auth'
import { AuthLayout } from '../layout/AuthLayout'
import { AuthBubble } from '../auth/AuthBubble'
import { AuthFieldHint } from '../auth/AuthFieldHint'
import { useAuthBubble } from '../../hooks/useAuthBubble'
import { useT } from '../../i18n'
import {
  PASSWORD_FIELD_HINT_KEY,
  validateEmail,
  validatePassword,
} from '../../utils/authValidation'
import { useEmailCodeCooldown } from '../../hooks/useEmailCodeCooldown'
import { emailCodeCooldownLabel } from '../../storage/emailCodeCooldown'

export function ForgotPassword() {
  const t = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const { message: bubble, show } = useAuthBubble()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { cooldown, startCooldown } = useEmailCodeCooldown('reset', email)

  const from =
    (location.state as { from?: string } | null)?.from ?? '/writing'

  const handleSendCode = async () => {
    const emailError = validateEmail(email)
    if (emailError) {
      show(t(emailError))
      return
    }

    setIsSending(true)
    try {
      await sendEmailCode(email.trim(), 'reset')
      show(t('auth.common.codeSent'))
      startCooldown()
    } catch (err) {
      if (isApiError(err) && err.isRateLimited) {
        startCooldown()
      }
      show(err instanceof Error ? err.message : t('auth.forgot.sendFailed'))
    } finally {
      setIsSending(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailError = validateEmail(email)
    if (emailError) {
      show(t(emailError))
      return
    }
    if (!code.trim()) {
      show(t('auth.common.fillCode'))
      return
    }
    if (!password) {
      show(t('auth.forgot.needPassword'))
      return
    }
    if (!confirmPassword) {
      show(t('auth.forgot.needConfirm'))
      return
    }
    if (password !== confirmPassword) {
      show(t('auth.common.passwordMismatch'))
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      show(t(passwordError))
      return
    }

    setIsSubmitting(true)
    try {
      await resetPassword(email.trim(), code.trim(), password)
      show(t('auth.forgot.success'))
      window.setTimeout(() => {
        navigate('/login', { replace: true, state: { from } })
      }, 1200)
    } catch (err) {
      show(err instanceof Error ? err.message : t('auth.forgot.failed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title={t('auth.forgot.title')}
      subtitle={t('auth.forgot.subtitle')}
      footer={
        <div className="w-full text-center">
          {t('auth.forgot.remember')}
          <Link
            to="/login"
            state={{ from }}
            className="ml-1 font-medium text-neutral-900 hover:underline"
          >
            {t('auth.forgot.backLogin')}
          </Link>
        </div>
      }
    >
      <AuthBubble message={bubble} />
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block font-sans text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            {t('auth.common.email')}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.forgot.emailPlaceholder')}
            autoComplete="email"
            className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-neutral-400 focus:bg-white"
          />
        </div>

        <div>
          <label className="mb-1.5 block font-sans text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            {t('auth.common.code')}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={t('auth.common.code')}
              maxLength={6}
              className="min-w-0 flex-1 rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={isSending || cooldown > 0}
              className="shrink-0 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {emailCodeCooldownLabel(cooldown, isSending, t)}
            </button>
          </div>
          <AuthFieldHint>{t('auth.common.codeHint')}</AuthFieldHint>
        </div>

        <div>
          <label className="mb-1.5 block font-sans text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            {t('auth.forgot.newPassword')}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.forgot.passwordPlaceholder')}
            autoComplete="new-password"
            className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-neutral-400 focus:bg-white"
          />
          <AuthFieldHint>{t(PASSWORD_FIELD_HINT_KEY)}</AuthFieldHint>
        </div>

        <div>
          <label className="mb-1.5 block font-sans text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            {t('auth.forgot.confirmNewPassword')}
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('auth.forgot.confirmPlaceholder')}
            autoComplete="new-password"
            className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-neutral-400 focus:bg-white"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-neutral-900 py-3 font-sans text-sm font-semibold tracking-wider text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 uppercase"
        >
          {isSubmitting ? t('auth.forgot.submitting') : t('auth.forgot.submit')}
        </button>
      </form>
    </AuthLayout>
  )
}
