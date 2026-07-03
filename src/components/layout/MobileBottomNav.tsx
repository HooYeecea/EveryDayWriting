import { NavLink } from 'react-router-dom'
import { LogIn, User } from 'lucide-react'
import { APP_ROUTES } from '../../config/routes'
import { useAuth } from '../../context/AuthContext'
import { NAV_ICON_MAP } from './navConfig'

const MAIN_ROUTES = APP_ROUTES.filter((route) => route.key !== 'user-center')

export function MobileBottomNav() {
  const { isAuthenticated } = useAuth()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="flex items-stretch justify-around">
        <NavLink
          to={isAuthenticated ? '/user-center' : '/login'}
          className={({ isActive }) =>
            `flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] transition-colors sm:text-xs ${
              isActive ? 'font-medium text-neutral-900' : 'text-neutral-500'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isAuthenticated ? (
                <User size={20} strokeWidth={isActive ? 2 : 1.75} />
              ) : (
                <LogIn size={20} strokeWidth={isActive ? 2 : 1.75} />
              )}
              <span className="truncate">{isAuthenticated ? '我的' : '登录'}</span>
            </>
          )}
        </NavLink>

        {MAIN_ROUTES.map((item) => {
          const Icon = NAV_ICON_MAP[item.icon]
          return (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) =>
                `flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] transition-colors sm:text-xs ${
                  isActive ? 'font-medium text-neutral-900' : 'text-neutral-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2 : 1.75} />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
