import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { PrivacyAgreementField } from '../auth/PrivacyAgreementField'
import { AuthFormAlert } from '../auth/AuthFormAlert'
import { useAuth } from '../../context/AuthContext'
import { AuthLayout } from '../layout/AuthLayout'

export function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [privacyWarning, setPrivacyWarning] = useState(false)
  const [error, setError] = useState('')

  const from =
    (location.state as { from?: string } | null)?.from ?? '/writing'

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!privacyAgreed) {
      setPrivacyWarning(true)
      return
    }

    setPrivacyWarning(false)
    try {
      login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
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
            placeholder="alex.chen@example.com"
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
        <p className="text-xs text-neutral-400">
          演示账号：alex.chen@example.com / 123456
        </p>
        <button
          type="submit"
          className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          登录
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
