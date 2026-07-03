import { Link } from 'react-router-dom'
import { Calendar, Flame, LogIn, Mail, PenLine, Trophy } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export function UserCenter() {
  const { user, isAuthenticated, logout } = useAuth()

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
          <LogIn size={28} className="text-neutral-400" strokeWidth={1.5} />
        </div>
        <h2 className="mt-5 text-lg font-medium text-neutral-800">您还未登录</h2>
        <p className="mt-2 max-w-sm text-center text-sm text-neutral-400">
          登录后即可查看个人信息、保存和提交写作
        </p>
        <div className="mt-6 flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:w-auto sm:flex-row">
          <Link
            to="/login"
            className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            立即登录
          </Link>
          <Link
            to="/register"
            className="rounded-lg border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            注册账号
          </Link>
        </div>
      </div>
    )
  }

  const stats = [
    { label: '累计写作', value: user.totalWritings, unit: '篇', icon: PenLine },
    { label: '累计字数', value: user.totalWords.toLocaleString(), unit: '字', icon: Trophy },
    { label: '连续打卡', value: user.streakDays, unit: '天', icon: Flame },
  ]

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">用户中心</h2>
            <p className="mt-1 text-sm text-neutral-400">个人信息与学习概览</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 sm:w-auto"
          >
            退出登录
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:mt-8 sm:p-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-lg font-semibold text-white">
              {user.avatar}
            </div>
            <div>
              <h3 className="text-lg font-medium text-neutral-900">{user.name}</h3>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500">
                <Mail size={14} />
                {user.email}
              </div>
              <span className="mt-2 inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                {user.level}
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-1.5 text-xs text-neutral-400">
            <Calendar size={13} />
            加入时间：{user.joinedAt}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {stats.map(({ label, value, unit, icon: Icon }) => (
            <div
              key={label}
              className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <Icon size={18} className="text-neutral-400" strokeWidth={1.5} />
              <p className="mt-3 text-xl font-semibold text-neutral-900 sm:text-2xl">
                {value}
                <span className="ml-0.5 text-sm font-normal text-neutral-400">{unit}</span>
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
