import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { isApiError } from '../../api/request'
import { AuthFormAlert } from '../auth/AuthFormAlert'
import { AuthLayout } from '../layout/AuthLayout'
import { useAuth } from '../../context/AuthContext'
import { getToken } from '../../storage/tokenStorage'
import { validatePassword } from '../../utils/authValidation'
import { DEFAULT_PATH } from '../../config/routes'

export function ChangePassword() {
  const navigate = useNavigate()
  const { mustChangePassword, isLoading, logout, completeForcedPasswordChange } = useAuth()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isLoading) {
    return (
      <AuthLayout
        title="修改密码"
        subtitle="正在加载…"
        brandHref={null}
        footer={null}
      >
        <p className="text-sm text-neutral-400">加载中…</p>
      </AuthLayout>
    )
  }

  if (!getToken()) {
    return <Navigate to="/login" replace />
  }

  if (!mustChangePassword) {
    return <Navigate to={DEFAULT_PATH} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!oldPassword) {
      setError('请输入当前密码')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致')
      return
    }

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setError(passwordError)
      return
    }
    if (oldPassword === newPassword) {
      setError('新密码不能与当前密码相同')
      return
    }

    setSubmitting(true)
    try {
      await completeForcedPasswordChange(oldPassword, newPassword)
      navigate(DEFAULT_PATH, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '修改密码失败')
      if (isApiError(err) && err.isUnauthorized) {
        await logout()
        navigate('/login', { replace: true })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <AuthLayout
      title="修改密码"
      subtitle="管理员首次登录须设置新密码，完成后方可使用其他功能"
      brandHref={null}
      footer={
        <div className="w-full text-center">
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-neutral-500 hover:text-neutral-900 hover:underline"
          >
            退出登录
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthFormAlert message={error} />
        <div>
          <label className="mb-1.5 block font-sans text-xs font-semibold tracking-wide text-neutral-500 uppercase">当前密码</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="请输入当前密码"
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-neutral-400 focus:bg-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-sans text-xs font-semibold tracking-wide text-neutral-500 uppercase">新密码</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="至少 8 位，含大小写字母和数字"
            required
            autoComplete="new-password"
            className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-neutral-400 focus:bg-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-sans text-xs font-semibold tracking-wide text-neutral-500 uppercase">确认新密码</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="再次输入新密码"
            required
            autoComplete="new-password"
            className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-neutral-400 focus:bg-white"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-neutral-900 py-3 font-sans text-sm font-semibold tracking-wider text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 uppercase"
        >
          {submitting ? '提交中…' : '确认修改'}
        </button>
      </form>
    </AuthLayout>
  )
}
