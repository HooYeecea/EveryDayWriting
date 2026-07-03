import { NavLink } from 'react-router-dom'
import { LogIn, User, X } from 'lucide-react'
import { APP_ROUTES } from '../../config/routes'
import { useAuth } from '../../context/AuthContext'
import { NAV_ICON_MAP } from './navConfig'

const MAIN_ROUTES = APP_ROUTES.filter((route) => route.key !== 'user-center')

interface SidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const { isAuthenticated } = useAuth()

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
      isActive
        ? 'bg-neutral-100 font-medium text-neutral-900'
        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
    }`

  const sidebarContent = (
    <>
      <div className="flex items-start justify-between border-b border-neutral-200 px-5 py-5">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-neutral-900">
            Everyday Writing
          </h1>
          <p className="mt-0.5 text-xs text-neutral-400">每日英语写作</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 lg:hidden"
            aria-label="关闭菜单"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        <NavLink
          to={isAuthenticated ? '/user-center' : '/login'}
          onClick={onClose}
          className={navLinkClass}
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
          const Icon = NAV_ICON_MAP[item.icon]
          return (
            <NavLink
              key={item.key}
              to={item.path}
              onClick={onClose}
              className={navLinkClass}
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
    </>
  )

  return (
    <>
      {mobileOpen && onClose && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-label="关闭菜单"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-neutral-200 bg-white transition-transform duration-300 ease-out lg:static lg:z-auto lg:w-56 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
