import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { AuthLoginResult } from '../../types'
import { isApiError } from '../../api/request'
import { sendEmailCode } from '../../api/auth'
import { acceptAgreement } from '../../api/agreements'
import { PrivacyAgreementField } from '../auth/PrivacyAgreementField'
import { AuthBubble } from '../auth/AuthBubble'
import { AuthFieldHint } from '../auth/AuthFieldHint'
import { useAuth } from '../../context/AuthContext'
import { AuthLayout } from '../layout/AuthLayout'
import { useAuthBubble } from '../../hooks/useAuthBubble'
import { useT } from '../../i18n'
import {
  PASSWORD_FIELD_HINT_KEY,
  validateEmail,
  validatePassword,
} from '../../utils/authValidation'
import { useEmailCodeCooldown } from '../../hooks/useEmailCodeCooldown'
import { emailCodeCooldownLabel } from '../../storage/emailCodeCooldown'

const fieldClass =
  'w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400'

export function Register() {
  const t = useT()
  const { register, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { message: bubble, show } = useAuthBubble()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [privacyAgreementId, setPrivacyAgreementId] = useState<string | undefined>()
  const [privacyWarning, setPrivacyWarning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const { cooldown, startCooldown } = useEmailCodeCooldown('register', email)

  const from =
    (location.state as { from?: string } | null)?.from ?? '/writing'

  if (isLoading) {
    return (
      <AuthLayout title={t('auth.register.title')} subtitle={t('auth.common.restoring')} footer={null}>
        <p className="text-sm text-neutral-400">{t('auth.common.loading')}</p>
      </AuthLayout>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const handleSendCode = async () => {
    const emailError = validateEmail(email)
    if (emailError) {
      show(t(emailError))
      return
    }
    setSendingCode(true)
    try {
      await sendEmailCode(email.trim(), 'register')
      startCooldown()
      show(t('auth.common.codeSent'))
    } catch (err) {
      if (isApiError(err) && err.isRateLimited) {
        startCooldown()
      }
      show(err instanceof Error ? err.message : t('auth.common.codeSendFailed'))
    } finally {
      setSendingCode(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
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
      show(t('auth.register.needPassword'))
      return
    }
    if (!confirmPassword) {
      show(t('auth.register.needConfirm'))
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

    if (!privacyAgreed) {
      setPrivacyWarning(true)
      show(t('auth.common.needPrivacy'))
      return
    }

    setPrivacyWarning(false)
    setSubmitting(true)
    try {
      const result: AuthLoginResult = await register(email.trim(), password, code.trim())
      if (privacyAgreementId) {
        try {
          await acceptAgreement(privacyAgreementId)
        } catch (acceptErr) {
          console.warn('[Register] 协议接受记录失败', acceptErr)
        }
      }
      navigate(
        result.mustChangePassword ? '/change-password' : result.redirectTo || from,
        { replace: true },
      )
    } catch (err) {
      show(err instanceof Error ? err.message : t('auth.register.failed'))
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrivacyChange = (checked: boolean) => {
    setPrivacyAgreed(checked)
    if (checked) {
      setPrivacyWarning(false)
    } else {
      setPrivacyAgreementId(undefined)
    }
  }

  return (
    <AuthLayout
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footer={
        <div className="w-full text-center">
          {t('auth.register.hasAccount')}
          <Link
            to="/login"
            state={{ from }}
            className="ml-1 font-medium text-neutral-900 hover:underline"
          >
            {t('auth.register.loginNow')}
          </Link>
        </div>
      }
    >
      <AuthBubble message={bubble} />
      <form noValidate onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            {t('auth.common.email')}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
            className={fieldClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            {t('auth.common.code')}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={t('auth.common.code')}
              maxLength={6}
              className={`min-w-0 flex-1 ${fieldClass}`}
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={sendingCode || cooldown > 0}
              className="shrink-0 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              {emailCodeCooldownLabel(cooldown, sendingCode, t)}
            </button>
          </div>
          <AuthFieldHint>{t('auth.common.codeHint')}</AuthFieldHint>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              {t('auth.common.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.register.passwordPlaceholder')}
              autoComplete="new-password"
              className={fieldClass}
            />
            <AuthFieldHint>{t(PASSWORD_FIELD_HINT_KEY)}</AuthFieldHint>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              {t('auth.common.confirmPassword')}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('auth.register.confirmPlaceholder')}
              autoComplete="new-password"
              className={fieldClass}
            />
          </div>
        </div>
        <PrivacyAgreementField
          checked={privacyAgreed}
          onChange={handlePrivacyChange}
          onAgreementIdChange={setPrivacyAgreementId}
          highlight={privacyWarning}
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-neutral-900 py-3 font-sans text-sm font-semibold tracking-wider text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 uppercase"
        >
          {submitting ? t('auth.register.submitting') : t('auth.register.submit')}
        </button>
      </form>
    </AuthLayout>
  )
}
