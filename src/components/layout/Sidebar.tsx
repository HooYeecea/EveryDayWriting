import {
  BookOpen,
  ClipboardList,
  PenLine,
  User,
  BarChart3,
} from 'lucide-react'
import type { MenuItem, MenuKey } from '../../types'

const MENU_ITEMS: MenuItem[] = [
  { key: 'user-center', label: '用户中心', icon: 'user' },
  { key: 'start-writing', label: '开始写作', icon: 'pen' },
  { key: 'writing-records', label: '写作记录', icon: 'clipboard' },
  { key: 'personal-vocabulary', label: '个人词库', icon: 'book' },
  { key: 'personal-assessment', label: '个人测评', icon: 'chart' },
]

const ICON_MAP = {
  user: User,
  pen: PenLine,
  clipboard: ClipboardList,
  book: BookOpen,
  chart: BarChart3,
} as const

interface SidebarProps {
  activeKey: MenuKey
  onSelect: (key: MenuKey) => void
}

export function Sidebar({ activeKey, onSelect }: SidebarProps) {
  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-5 py-5">
        <h1 className="text-base font-semibold tracking-tight text-neutral-900">
          Everyday Writing
        </h1>
        <p className="mt-0.5 text-xs text-neutral-400">每日英语写作</p>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {MENU_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP]
          const isActive = activeKey === item.key

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-neutral-100 font-medium text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2 : 1.75}
                className={isActive ? 'text-neutral-800' : 'text-neutral-400'}
              />
              {item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
