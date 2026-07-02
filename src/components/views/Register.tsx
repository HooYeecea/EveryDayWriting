import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { PrivacyAgreementField } from '../auth/PrivacyAgreementField'
import { AuthFormAlert } from '../auth/AuthFormAlert'
import { useAuth } from '../../context/AuthContext'
import { AuthLayout } from '../layout/AuthLayout'

const fieldClass =
  'w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400'

export function Register() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    if (password.length < 6) {
      setError('密码至少 6 位')
      return
    }

    setPrivacyWarning(false)
    try {
      register(name.trim(), email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败')
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
          <label className="mb-1 block text-sm font-medium text-neutral-700">昵称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="你的昵称"
            required
            className={fieldClass}
          />
        </div>
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
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
          highlight={privacyWarning}
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-neutral-900 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          注册
        </button>
      </form>
    </AuthLayout>
  )
}
