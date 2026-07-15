import { NavLink } from 'react-router-dom'
import { LogIn, User } from 'lucide-react'
import type { MouseEvent } from 'react'
import { APP_ROUTES, DEFAULT_PATH } from '../../config/routes'
import { useAppAlert } from '../../context/AppAlertContext'
import { useAuth } from '../../context/AuthContext'
import { useWritingFocus } from '../../context/WritingFocusContext'
import { NAV_ICON_MAP } from './navConfig'

const MAIN_ROUTES = APP_ROUTES.filter((route) => route.key !== 'user-center')
const FOCUS_LOCK_HINT = '专注写作中，请先结束或停止计时后再切换页面'

export function MobileBottomNav() {
  const { isAuthenticated } = useAuth()
  const { navigationLocked } = useWritingFocus()
  const { alert } = useAppAlert()

  const guardNavClick = (targetPath: string, event: MouseEvent) => {
    if (navigationLocked && targetPath !== DEFAULT_PATH) {
      event.preventDefault()
      void alert({
        title: '专注写作中',
        message: FOCUS_LOCK_HINT,
        variant: 'info',
      })
    }
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] transition-all duration-200 sm:text-xs ${
      isActive
        ? 'font-medium text-neutral-900'
        : navigationLocked
          ? 'cursor-not-allowed text-neutral-300'
          : 'text-neutral-500 active:scale-95'
    }`

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="flex items-stretch justify-around">
        <NavLink
          to={isAuthenticated ? '/user-center' : '/login'}
          onClick={(event) =>
            guardNavClick(isAuthenticated ? '/user-center' : '/login', event)
          }
          className={linkClass}
          aria-disabled={navigationLocked}
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
              onClick={(event) => guardNavClick(item.path, event)}
              className={linkClass}
              aria-disabled={navigationLocked && item.path !== DEFAULT_PATH}
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
