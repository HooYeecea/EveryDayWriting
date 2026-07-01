import { Calendar, Flame, Mail, PenLine, Trophy } from 'lucide-react'
import { MOCK_USER } from '../../data/mockUser'

export function UserCenter() {
  const stats = [
    { label: '累计写作', value: MOCK_USER.totalWritings, unit: '篇', icon: PenLine },
    { label: '累计字数', value: MOCK_USER.totalWords.toLocaleString(), unit: '字', icon: Trophy },
    { label: '连续打卡', value: MOCK_USER.streakDays, unit: '天', icon: Flame },
  ]

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-xl font-semibold text-neutral-900">用户中心</h2>
        <p className="mt-1 text-sm text-neutral-400">个人信息与学习概览（静态演示数据）</p>

        <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-lg font-semibold text-white">
              {MOCK_USER.avatar}
            </div>
            <div>
              <h3 className="text-lg font-medium text-neutral-900">{MOCK_USER.name}</h3>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500">
                <Mail size={14} />
                {MOCK_USER.email}
              </div>
              <span className="mt-2 inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                {MOCK_USER.level}
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-1.5 text-xs text-neutral-400">
            <Calendar size={13} />
            加入时间：{MOCK_USER.joinedAt}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          {stats.map(({ label, value, unit, icon: Icon }) => (
            <div
              key={label}
              className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <Icon size={18} className="text-neutral-400" strokeWidth={1.5} />
              <p className="mt-3 text-2xl font-semibold text-neutral-900">
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
