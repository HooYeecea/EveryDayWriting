import { NavLink } from 'react-router-dom'
import { LogIn, User } from 'lucide-react'
import type { MouseEvent } from 'react'
import { APP_ROUTES, DEFAULT_PATH } from '../../config/routes'
import { useAppAlert } from '../../context/AppAlertContext'
import { useAuth } from '../../context/AuthContext'
import { useWritingFocus } from '../../context/WritingFocusContext'
import { useProficiencyGuideRedDot } from '../../hooks/useProficiencyGuideRedDot'
import { getRouteLabelKey, useT } from '../../i18n'
import { NAV_ICON_MAP } from './navConfig'

/** 底栏空间有限：系统设置走顶栏齿轮 / 侧栏抽屉，不占用底栏 */
const MAIN_ROUTES = APP_ROUTES.filter(
  (route) => route.key !== 'user-center' && route.key !== 'system-settings',
)

export function MobileBottomNav() {
  const { isAuthenticated } = useAuth()
  const { navigationLocked } = useWritingFocus()
  const { alert } = useAppAlert()
  const showGuideRedDot = useProficiencyGuideRedDot()
  const t = useT()

  const guardNavClick = (targetPath: string, event: MouseEvent) => {
    if (navigationLocked && targetPath !== DEFAULT_PATH) {
      event.preventDefault()
      void alert({
        title: t('nav.focusLockTitle'),
        message: t('nav.focusLockHint'),
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
              <span className="truncate">{isAuthenticated ? t('nav.my') : t('nav.login')}</span>
            </>
          )}
        </NavLink>

        {MAIN_ROUTES.map((item) => {
          const Icon = NAV_ICON_MAP[item.icon]
          const label = t(getRouteLabelKey(item.key))
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
                  <span className="relative">
                    <Icon size={20} strokeWidth={isActive ? 2 : 1.75} />
                    {item.key === 'usage-guide' && showGuideRedDot && (
                      <span
                        className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-red-500"
                        aria-label={t('nav.proficiencyIncomplete')}
                      />
                    )}
                  </span>
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
