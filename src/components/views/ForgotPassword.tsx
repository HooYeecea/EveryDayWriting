import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { sendEmailCode, resetPassword } from '../../api/auth'
import { getCodeCooldownRemaining } from '../../storage/verificationCodeStorage'
import { AuthLayout } from '../layout/AuthLayout'

export function ForgotPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [demoCodeHint, setDemoCodeHint] = useState('')

  const from =
    (location.state as { from?: string } | null)?.from ?? '/writing'

  useEffect(() => {
    if (!email.trim()) {
      setCooldown(0)
      return
    }
    setCooldown(getCodeCooldownRemaining(email))
  }, [email])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => {
      const remain = getCodeCooldownRemaining(email)
      setCooldown(remain)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldown, email])

  const handleSendCode = async () => {
    setError('')
    setSuccess('')
    setDemoCodeHint('')

    if (!email.trim()) {
      setError('请先输入邮箱')
      return
    }

    setIsSending(true)
    try {
      const result = sendEmailCode(email.trim())
      setSuccess('验证码已发送，请查收邮箱')
      setCooldown(60)
      if (result.demoCode) {
        setDemoCodeHint(`演示模式验证码：${result.demoCode}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败')
    } finally {
      setIsSending(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!code.trim()) {
      setError('请输入验证码')
      return
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    if (password.length < 6) {
      setError('密码至少 6 位')
      return
    }

    setIsSubmitting(true)
    try {
      resetPassword(email.trim(), code.trim(), password)
      setSuccess('密码重置成功，请使用新密码登录')
      setTimeout(() => {
        navigate('/login', { replace: true, state: { from } })
      }, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置失败')
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
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        {success && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>
        )}
        {demoCodeHint && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">{demoCodeHint}</p>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="请输入注册邮箱"
            required
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">验证码</label>
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
              onClick={handleSendCode}
              disabled={isSending || cooldown > 0}
              className="shrink-0 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? '发送中…' : cooldown > 0 ? `${cooldown}s` : '获取验证码'}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">新密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 6 位"
            required
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">确认新密码</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="再次输入新密码"
            required
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? '重置中…' : '重置密码'}
        </button>
      </form>
    </AuthLayout>
  )
}
