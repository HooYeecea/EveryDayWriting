import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { isApiError } from '../../api/request'
import { AuthBubble } from '../auth/AuthBubble'
import { AuthFieldHint } from '../auth/AuthFieldHint'
import { AuthLayout } from '../layout/AuthLayout'
import { useAuth } from '../../context/AuthContext'
import { useAuthBubble } from '../../hooks/useAuthBubble'
import { getToken } from '../../storage/tokenStorage'
import { PASSWORD_FIELD_HINT_KEY, validatePassword } from '../../utils/authValidation'
import { getDefaultHomePath } from '../../utils/roles'
import { loadUserPreferences } from '../../storage/preferencesStorage'
import { DEFAULT_PATH } from '../../config/routes'
import { useT } from '../../i18n'

export function ChangePassword() {
  const t = useT()
  const navigate = useNavigate()
  const { mustChangePassword, isLoading, logout, completeForcedPasswordChange, roles, permissions } =
    useAuth()
  const { message: bubble, show } = useAuthBubble()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const homePath = getDefaultHomePath(
    roles,
    permissions,
    loadUserPreferences().ui.defaultHomePath,
  )

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
    return <Navigate to={homePath} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!oldPassword) {
      show('请填写当前密码')
      return
    }
    if (!newPassword) {
      show('请设置新密码')
      return
    }
    if (!confirmPassword) {
      show('请再次输入新密码')
      return
    }
    if (newPassword !== confirmPassword) {
      show('两次输入的密码不一致')
      return
    }

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      show(t(passwordError))
      return
    }
    if (oldPassword === newPassword) {
      show('新密码不能与当前密码相同')
      return
    }

    setSubmitting(true)
    try {
      await completeForcedPasswordChange(oldPassword, newPassword)
      navigate(homePath, { replace: true })
    } catch (err) {
      show(err instanceof Error ? err.message : '修改密码失败')
      if (isApiError(err) && err.isUnauthorized) {
        await logout()
        navigate(DEFAULT_PATH, { replace: true })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate(DEFAULT_PATH, { replace: true })
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
      <AuthBubble message={bubble} />
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block font-sans text-xs font-semibold tracking-wide text-neutral-500 uppercase">当前密码</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="当前密码"
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
            placeholder="设置新密码"
            autoComplete="new-password"
            className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-neutral-400 focus:bg-white"
          />
          <AuthFieldHint>{t(PASSWORD_FIELD_HINT_KEY)}</AuthFieldHint>
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
          disabled={submitting}
          className="w-full rounded-md bg-neutral-900 py-3 font-sans text-sm font-semibold tracking-wider text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 uppercase"
        >
          {submitting ? '提交中…' : '确认修改'}
        </button>
      </form>
    </AuthLayout>
  )
}
