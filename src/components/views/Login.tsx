import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  fetchGraphCaptcha,
  getGraphCaptchaCooldownRemaining,
  refreshGraphCaptcha,
} from '../../api/graphCaptchaApi'
import { isApiError } from '../../api/request'
import type { LoginErrorData } from '../../types'
import { PrivacyAgreementField } from '../auth/PrivacyAgreementField'
import { AuthFormAlert } from '../auth/AuthFormAlert'
import { useAuth } from '../../context/AuthContext'
import { AuthLayout } from '../layout/AuthLayout'
import { buildGraphCaptchaImageSrc } from '../../utils/graphCaptchaImage'

function isCaptchaExpiredMessage(message: string): boolean {
  return /过期|失效|无效/.test(message) && message.includes('验证码')
}

export function Login() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaCode, setCaptchaCode] = useState('')
  const [captchaId, setCaptchaId] = useState('')
  const [captchaImageSrc, setCaptchaImageSrc] = useState('')
  const [requireCaptcha, setRequireCaptcha] = useState(false)
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [privacyWarning, setPrivacyWarning] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loadingCaptcha, setLoadingCaptcha] = useState(false)
  const [captchaCooldown, setCaptchaCooldown] = useState(0)
  const captchaRequestedRef = useRef(false)

  const from =
    (location.state as { from?: string } | null)?.from ?? '/writing'

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
        setError(err instanceof Error ? err.message : '图形验证码加载失败')
      } finally {
        setLoadingCaptcha(false)
      }
    },
    [applyCaptcha],
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
      <AuthLayout title="登录" subtitle="正在恢复登录状态…" footer={null}>
        <p className="text-sm text-neutral-400">加载中…</p>
      </AuthLayout>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!privacyAgreed) {
      setPrivacyWarning(true)
      return
    }

    if (requireCaptcha) {
      if (!captchaId) {
        setError('图形验证码加载中，请稍候')
        return
      }
      if (!captchaCode.trim()) {
        setError('请输入图形验证码')
        return
      }
    }

    setPrivacyWarning(false)
    setSubmitting(true)
    try {
      await login(
        email.trim(),
        password,
        requireCaptcha ? { captchaId, graphCode: captchaCode.trim() } : undefined,
      )
      navigate(from, { replace: true })
    } catch (err) {
      if (isApiError(err)) {
        const data = err.data as LoginErrorData | null
        const message = err.message
        if (data?.requireCaptcha || message.includes('验证码')) {
          setRequireCaptcha(true)
        }
        if (isCaptchaExpiredMessage(message)) {
          captchaRequestedRef.current = false
          void loadGraphCaptcha('refresh')
        }
      }
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrivacyChange = (checked: boolean) => {
    setPrivacyAgreed(checked)
    if (checked) {
      setPrivacyWarning(false)
    }
  }

  const refreshLabel =
    loadingCaptcha ? '加载中…' : captchaCooldown > 0 ? `${captchaCooldown}s` : '换一张'

  return (
    <AuthLayout
      title="登录"
      subtitle="登录后即可保存和提交写作"
      footer={
        <div className="flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Link
            to="/forgot-password"
            state={{ from }}
            className="text-sm text-neutral-500 hover:text-neutral-900 hover:underline"
          >
            找回密码
          </Link>
          <span>
            还没有账号？
            <Link
              to="/register"
              state={{ from }}
              className="ml-1 font-medium text-neutral-900 hover:underline"
            >
              立即注册
            </Link>
          </span>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthFormAlert message={error} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            required
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
          />
        </div>
        {requireCaptcha && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">图形验证码</label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <div className="flex h-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 px-1">
                  {captchaImageSrc ? (
                    <img
                      src={captchaImageSrc}
                      alt="图形验证码"
                      className="h-10 w-auto max-w-[140px] object-contain"
                    />
                  ) : (
                    <span className="px-3 text-xs text-neutral-400">
                      {loadingCaptcha ? '加载中…' : '暂无'}
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
                placeholder="请输入图中字符"
                required
                maxLength={8}
                autoComplete="off"
                className="min-w-0 flex-1 rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
              />
            </div>
            <p className="mt-1.5 text-xs text-neutral-400">
              密码错误次数过多，请输入图形验证码（60 秒内仅可刷新一次）
            </p>
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? '登录中…' : '登录'}
        </button>
        <PrivacyAgreementField
          checked={privacyAgreed}
          onChange={handlePrivacyChange}
          highlight={privacyWarning}
        />
      </form>
    </AuthLayout>
  )
}
