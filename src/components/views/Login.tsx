import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { isApiError } from '../../api/request'
import { sendEmailCode } from '../../api/auth'
import type { LoginErrorData } from '../../types'
import { PrivacyAgreementField } from '../auth/PrivacyAgreementField'
import { AuthFormAlert } from '../auth/AuthFormAlert'
import { useAuth } from '../../context/AuthContext'
import { AuthLayout } from '../layout/AuthLayout'
import { useEmailCodeCooldown } from '../../hooks/useEmailCodeCooldown'
import { emailCodeCooldownLabel } from '../../storage/emailCodeCooldown'

export function Login() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [requireCaptcha, setRequireCaptcha] = useState(false)
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [privacyWarning, setPrivacyWarning] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const { cooldown, startCooldown } = useEmailCodeCooldown('login_captcha', email)

  const from =
    (location.state as { from?: string } | null)?.from ?? '/writing'

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

  const handleSendCaptcha = async () => {
    if (!email.trim()) {
      setError('请先输入邮箱')
      return
    }
    setSendingCode(true)
    setError('')
    try {
      await sendEmailCode(email.trim(), 'login_captcha')
      startCooldown()
    } catch (err) {
      if (isApiError(err) && err.isRateLimited) {
        startCooldown()
      }
      setError(err instanceof Error ? err.message : '验证码发送失败')
    } finally {
      setSendingCode(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!privacyAgreed) {
      setPrivacyWarning(true)
      return
    }

    setPrivacyWarning(false)
    setSubmitting(true)
    try {
      const result = await login(email.trim(), password, requireCaptcha ? code : undefined)
      navigate(result.mustChangePassword ? '/change-password' : from, { replace: true })
    } catch (err) {
      if (isApiError(err)) {
        const data = err.data as LoginErrorData | null
        const message = err.message
        if (data?.requireCaptcha || message.includes('验证码')) {
          setRequireCaptcha(true)
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
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">邮箱验证码</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6 位验证码"
                required
                maxLength={6}
                className="min-w-0 flex-1 rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
              />
              <button
                type="button"
                onClick={handleSendCaptcha}
                disabled={sendingCode || cooldown > 0}
                className="shrink-0 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                {emailCodeCooldownLabel(cooldown, sendingCode)}
              </button>
            </div>
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
