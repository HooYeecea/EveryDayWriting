import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { acceptAgreement } from '../../api/agreements'
import {
  fetchGraphCaptcha,
  getGraphCaptchaCooldownRemaining,
  refreshGraphCaptcha,
} from '../../api/graphCaptchaApi'
import { isApiError } from '../../api/request'
import type { AuthLoginResult, LoginErrorData } from '../../types'
import { PrivacyAgreementField } from '../auth/PrivacyAgreementField'
import { AuthBubble } from '../auth/AuthBubble'
import { AuthFieldHint } from '../auth/AuthFieldHint'
import { useAuth } from '../../context/AuthContext'
import { AuthLayout } from '../layout/AuthLayout'
import { useAuthBubble } from '../../hooks/useAuthBubble'
import { useT } from '../../i18n'
import { buildGraphCaptchaImageSrc } from '../../utils/graphCaptchaImage'
import { validateEmail } from '../../utils/authValidation'
import { getDefaultHomePath } from '../../utils/roles'
import { loadUserPreferences } from '../../storage/preferencesStorage'

function isCaptchaExpiredMessage(message: string): boolean {
  return (
    (/过期|失效|无效/.test(message) && message.includes('验证码')) ||
    (/expired|invalid/i.test(message) && /captcha|code/i.test(message))
  )
}

export function Login() {
  const t = useT()
  const { login, isAuthenticated, isLoading, roles, permissions } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { message: bubble, show } = useAuthBubble()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaCode, setCaptchaCode] = useState('')
  const [captchaId, setCaptchaId] = useState('')
  const [captchaImageSrc, setCaptchaImageSrc] = useState('')
  const [requireCaptcha, setRequireCaptcha] = useState(false)
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [privacyAgreementId, setPrivacyAgreementId] = useState<string | undefined>()
  const [privacyWarning, setPrivacyWarning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loadingCaptcha, setLoadingCaptcha] = useState(false)
  const [captchaCooldown, setCaptchaCooldown] = useState(0)
  const captchaRequestedRef = useRef(false)

  const from = (location.state as { from?: string } | null)?.from
  const authenticatedHome = getDefaultHomePath(
    roles,
    permissions,
    loadUserPreferences().ui.defaultHomePath,
  )

  const applyCaptcha = useCallback((data: { captchaId: string; imageBase64: string }, resetInput: boolean) => {
    setCaptchaId(data.captchaId)
    setCaptchaImageSrc(buildGraphCaptchaImageSrc(data.imageBase64))
    if (resetInput) {
      setCaptchaCode('')
    }
    setCaptchaCooldown(getGraphCaptchaCooldownRemaining())
  }, [])

  const loadGraphCaptcha = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      setLoadingCaptcha(true)
      try {
        const data =
          mode === 'refresh' ? await refreshGraphCaptcha() : await fetchGraphCaptcha()
        applyCaptcha(data, mode === 'refresh')
      } catch (err) {
        setCaptchaCooldown(getGraphCaptchaCooldownRemaining())
        show(err instanceof Error ? err.message : t('auth.login.captchaLoadFailed'))
      } finally {
        setLoadingCaptcha(false)
      }
    },
    [applyCaptcha, show, t],
  )

  useEffect(() => {
    if (!requireCaptcha) {
      captchaRequestedRef.current = false
      return
    }
    if (captchaRequestedRef.current) return
    captchaRequestedRef.current = true
    void loadGraphCaptcha('initial')
  }, [requireCaptcha, loadGraphCaptcha])

  useEffect(() => {
    if (!requireCaptcha || captchaCooldown <= 0) return
    const timer = window.setInterval(() => {
      setCaptchaCooldown(getGraphCaptchaCooldownRemaining())
    }, 1000)
    return () => window.clearInterval(timer)
  }, [requireCaptcha, captchaCooldown])

  if (isLoading) {
    return (
      <AuthLayout title={t('auth.login.title')} subtitle={t('auth.common.restoring')} footer={null}>
        <p className="text-sm text-neutral-400">{t('auth.common.loading')}</p>
      </AuthLayout>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={authenticatedHome} replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const emailError = validateEmail(email)
    if (emailError) {
      show(t(emailError))
      return
    }
    if (!password) {
      show(t('auth.login.needPassword'))
      return
    }

    if (!privacyAgreed) {
      setPrivacyWarning(true)
      show(t('auth.common.needPrivacy'))
      return
    }

    if (requireCaptcha) {
      if (!captchaId) {
        show(t('auth.login.captchaNeedWait'))
        return
      }
      if (!captchaCode.trim()) {
        show(t('auth.login.captchaRequired'))
        return
      }
    }

    setPrivacyWarning(false)
    setSubmitting(true)
    try {
      const result: AuthLoginResult = await login(
        email.trim(),
        password,
        requireCaptcha ? { captchaId, graphCode: captchaCode.trim() } : undefined,
      )

      if (!result.mustChangePassword && privacyAgreementId) {
        try {
          await acceptAgreement(privacyAgreementId)
        } catch (acceptErr) {
          console.warn('[Login] 协议接受记录失败', acceptErr)
        }
      }

      const nextPath = result.mustChangePassword
        ? '/change-password'
        : result.redirectTo === '/proficiency-test'
          ? '/proficiency-test'
          : result.redirectTo === '/admin'
            ? '/admin'
            : from && from !== '/login' && !from.startsWith('/admin')
              ? from
              : result.redirectTo
      navigate(nextPath, { replace: true })
    } catch (err) {
      if (isApiError(err)) {
        const data = err.data as LoginErrorData | null
        const message = err.message
        if (data?.requireCaptcha || message.includes('验证码') || /captcha/i.test(message)) {
          setRequireCaptcha(true)
        }
        if (isCaptchaExpiredMessage(message)) {
          captchaRequestedRef.current = false
          void loadGraphCaptcha('refresh')
        }
      }
      show(err instanceof Error ? err.message : t('auth.login.failed'))
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

  const refreshLabel = loadingCaptcha
    ? t('auth.common.loading')
    : captchaCooldown > 0
      ? `${captchaCooldown}s`
      : t('auth.login.captchaRefresh')

  return (
    <AuthLayout
      title={t('auth.login.title')}
      subtitle=""
      footer={
        <div className="flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Link
            to="/forgot-password"
            state={{ from }}
            className="text-sm text-neutral-500 hover:text-neutral-900 hover:underline"
          >
            {t('auth.login.forgot')}
          </Link>
          <span>
            {t('auth.login.noAccount')}
            <Link
              to="/register"
              state={{ from }}
              className="ml-1 font-medium text-neutral-900 hover:underline"
            >
              {t('auth.login.registerNow')}
            </Link>
          </span>
        </div>
      }
    >
      <AuthBubble message={bubble} />
      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block font-sans text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            {t('auth.common.email')}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
            className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-neutral-400 focus:bg-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-sans text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            {t('auth.common.password')}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.common.password')}
            autoComplete="current-password"
            className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-neutral-400 focus:bg-white"
          />
        </div>
        {requireCaptcha && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              {t('auth.login.captcha')}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <div className="flex h-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 px-1">
                  {captchaImageSrc ? (
                    <img
                      src={captchaImageSrc}
                      alt={t('auth.login.captchaAlt')}
                      className="h-10 w-auto max-w-[140px] object-contain"
                    />
                  ) : (
                    <span className="px-3 text-xs text-neutral-400">
                      {loadingCaptcha ? t('auth.common.loading') : t('auth.common.none')}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void loadGraphCaptcha('refresh')}
                  disabled={loadingCaptcha || captchaCooldown > 0}
                  className="shrink-0 rounded-lg border border-neutral-200 px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  {refreshLabel}
                </button>
              </div>
              <input
                type="text"
                value={captchaCode}
                onChange={(e) => setCaptchaCode(e.target.value.replace(/\s/g, '').slice(0, 8))}
                placeholder={t('auth.login.captchaPlaceholder')}
                maxLength={8}
                autoComplete="off"
                className="min-w-0 flex-1 rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
              />
            </div>
            <AuthFieldHint>{t('auth.login.captchaHint')}</AuthFieldHint>
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-neutral-900 py-3 font-sans text-sm font-semibold tracking-wider text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 uppercase"
        >
          {submitting ? t('auth.login.submitting') : t('auth.login.submit')}
        </button>
        <PrivacyAgreementField
          checked={privacyAgreed}
          onChange={handlePrivacyChange}
          onAgreementIdChange={setPrivacyAgreementId}
          highlight={privacyWarning}
        />
      </form>
    </AuthLayout>
  )
}
