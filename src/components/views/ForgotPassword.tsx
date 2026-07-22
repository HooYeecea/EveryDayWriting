import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { isApiError } from '../../api/request'
import { sendEmailCode, resetPassword } from '../../api/auth'
import { AuthLayout } from '../layout/AuthLayout'
import { AuthBubble } from '../auth/AuthBubble'
import { AuthFieldHint } from '../auth/AuthFieldHint'
import { useAuthBubble } from '../../hooks/useAuthBubble'
import {
  PASSWORD_FIELD_HINT,
  validateEmail,
  validatePassword,
} from '../../utils/authValidation'
import { useEmailCodeCooldown } from '../../hooks/useEmailCodeCooldown'
import { emailCodeCooldownLabel } from '../../storage/emailCodeCooldown'

export function ForgotPassword() {
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
      show(emailError)
      return
    }

    setIsSending(true)
    try {
      await sendEmailCode(email.trim(), 'reset')
      show('验证码已发送，请查收邮箱')
      startCooldown()
    } catch (err) {
      if (isApiError(err) && err.isRateLimited) {
        startCooldown()
      }
      show(err instanceof Error ? err.message : '发送失败')
    } finally {
      setIsSending(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailError = validateEmail(email)
    if (emailError) {
      show(emailError)
      return
    }
    if (!code.trim()) {
      show('请填写验证码')
      return
    }
    if (!password) {
      show('请设置新密码')
      return
    }
    if (!confirmPassword) {
      show('请再次输入新密码')
      return
    }
    if (password !== confirmPassword) {
      show('两次输入的密码不一致')
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      show(passwordError)
      return
    }

    setIsSubmitting(true)
    try {
      await resetPassword(email.trim(), code.trim(), password)
      show('密码重置成功，请使用新密码登录')
      window.setTimeout(() => {
        navigate('/login', { replace: true, state: { from } })
      }, 1200)
    } catch (err) {
      show(err instanceof Error ? err.message : '重置失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="找回密码"
      subtitle="通过邮箱验证码重置您的密码"
      footer={
        <div className="w-full text-center">
          想起密码了？
          <Link
            to="/login"
            state={{ from }}
            className="ml-1 font-medium text-neutral-900 hover:underline"
          >
            返回登录
          </Link>
        </div>
      }
    >
      <AuthBubble message={bubble} />
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block font-sans text-xs font-semibold tracking-wide text-neutral-500 uppercase">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="注册时使用的邮箱"
            autoComplete="email"
            className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-neutral-400 focus:bg-white"
          />
        </div>

        <div>
          <label className="mb-1.5 block font-sans text-xs font-semibold tracking-wide text-neutral-500 uppercase">验证码</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="验证码"
              maxLength={6}
              className="min-w-0 flex-1 rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={isSending || cooldown > 0}
              className="shrink-0 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {emailCodeCooldownLabel(cooldown, isSending)}
            </button>
          </div>
          <AuthFieldHint>发送至邮箱的 6 位数字</AuthFieldHint>
        </div>

        <div>
          <label className="mb-1.5 block font-sans text-xs font-semibold tracking-wide text-neutral-500 uppercase">新密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="设置新密码"
            autoComplete="new-password"
            className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-neutral-400 focus:bg-white"
          />
          <AuthFieldHint>{PASSWORD_FIELD_HINT}</AuthFieldHint>
        </div>

        <div>
          <label className="mb-1.5 block font-sans text-xs font-semibold tracking-wide text-neutral-500 uppercase">确认新密码</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="再输入一次"
            autoComplete="new-password"
            className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-neutral-400 focus:bg-white"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-neutral-900 py-3 font-sans text-sm font-semibold tracking-wider text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 uppercase"
        >
          {isSubmitting ? '重置中…' : '重置密码'}
        </button>
      </form>
    </AuthLayout>
  )
}
