import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { AuthLoginResult } from '../../types'
import { isApiError } from '../../api/request'
import { sendEmailCode } from '../../api/auth'
import { acceptAgreement } from '../../api/agreements'
import { PrivacyAgreementField } from '../auth/PrivacyAgreementField'
import { AuthFormAlert } from '../auth/AuthFormAlert'
import { useAuth } from '../../context/AuthContext'
import { AuthLayout } from '../layout/AuthLayout'
import { validatePassword } from '../../utils/authValidation'
import { useEmailCodeCooldown } from '../../hooks/useEmailCodeCooldown'
import { emailCodeCooldownLabel } from '../../storage/emailCodeCooldown'

const fieldClass =
  'w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400'

export function Register() {
  const { register, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [privacyAgreementId, setPrivacyAgreementId] = useState<string | undefined>()
  const [privacyWarning, setPrivacyWarning] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const { cooldown, startCooldown } = useEmailCodeCooldown('register', email)

  const from =
    (location.state as { from?: string } | null)?.from ?? '/writing'

  if (isLoading) {
    return (
      <AuthLayout title="注册" subtitle="正在恢复登录状态…" footer={null}>
        <p className="text-sm text-neutral-400">加载中…</p>
      </AuthLayout>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('请先输入邮箱')
      return
    }
    setSendingCode(true)
    setError('')
    try {
      await sendEmailCode(email.trim(), 'register')
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!privacyAgreed) {
      setPrivacyWarning(true)
      return
    }

    if (!code.trim()) {
      setError('请输入邮箱验证码')
      return
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
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
      navigate(result.mustChangePassword ? '/change-password' : from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败')
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
      title="注册"
      subtitle="创建账号，开始你的英语写作之旅"
      footer={
        <div className="w-full text-center">
          已有账号？
          <Link
            to="/login"
            state={{ from }}
            className="ml-1 font-medium text-neutral-900 hover:underline"
          >
            立即登录
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <AuthFormAlert message={error} />
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className={fieldClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">验证码</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6 位验证码"
              required
              maxLength={6}
              className={`min-w-0 flex-1 ${fieldClass}`}
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={sendingCode || cooldown > 0}
              className="shrink-0 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              {emailCodeCooldownLabel(cooldown, sendingCode)}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 8 位，含大小写和数字"
              required
              className={fieldClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">确认密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入"
              required
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
          {submitting ? '注册中…' : '注册'}
        </button>
      </form>
    </AuthLayout>
  )
}
