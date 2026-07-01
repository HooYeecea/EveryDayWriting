import { NavLink } from 'react-router-dom'
import {
  BookOpen,
  ClipboardList,
  PenLine,
  User,
  BarChart3,
  LogIn,
} from 'lucide-react'
import { APP_ROUTES } from '../../config/routes'
import { useAuth } from '../../context/AuthContext'

const ICON_MAP = {
  user: User,
  pen: PenLine,
  clipboard: ClipboardList,
  book: BookOpen,
  chart: BarChart3,
} as const

const MAIN_ROUTES = APP_ROUTES.filter((route) => route.key !== 'user-center')

export function Sidebar() {
  const { isAuthenticated } = useAuth()

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-5 py-5">
        <h1 className="text-base font-semibold tracking-tight text-neutral-900">
          Everyday Writing
        </h1>
        <p className="mt-0.5 text-xs text-neutral-400">每日英语写作</p>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        <NavLink
          to={isAuthenticated ? '/user-center' : '/login'}
          className={({ isActive }) =>
            `flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              isActive
                ? 'bg-neutral-100 font-medium text-neutral-900'
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isAuthenticated ? (
                <User
                  size={18}
                  strokeWidth={isActive ? 2 : 1.75}
                  className={isActive ? 'text-neutral-800' : 'text-neutral-400'}
                />
              ) : (
                <LogIn
                  size={18}
                  strokeWidth={isActive ? 2 : 1.75}
                  className={isActive ? 'text-neutral-800' : 'text-neutral-400'}
                />
              )}
              {isAuthenticated ? '用户中心' : '立即登录'}
            </>
          )}
        </NavLink>

        {MAIN_ROUTES.map((item) => {
          const Icon = ICON_MAP[item.icon]
          return (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) =>
                `flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-neutral-100 font-medium text-neutral-900'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2 : 1.75}
                    className={isActive ? 'text-neutral-800' : 'text-neutral-400'}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
