import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { AuthLayout } from '../layout/AuthLayout'

export function Register() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/writing" replace />
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    if (password.length < 6) {
      setError('密码至少 6 位')
      return
    }

    try {
      register(name.trim(), email.trim(), password)
      navigate('/writing', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败')
    }
  }

  return (
    <AuthLayout
      title="注册"
      subtitle="创建账号，开始你的英语写作之旅"
      footer={
        <>
          已有账号？
          <Link to="/login" className="ml-1 font-medium text-neutral-900 hover:underline">
            立即登录
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">昵称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="你的昵称"
            required
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
          />
        </div>
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
            placeholder="至少 6 位"
            required
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">确认密码</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="再次输入密码"
            required
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          注册
        </button>
      </form>
    </AuthLayout>
  )
}
