import { NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight, LogIn, User, X } from 'lucide-react'
import { APP_ROUTES } from '../../config/routes'
import { useAuth } from '../../context/AuthContext'
import { NAV_ICON_MAP } from './navConfig'
import {
  PANEL_HEADER_CLASS,
  PANEL_HEADER_ROW_CLASS,
  PANEL_SUBTITLE_CLASS,
  PANEL_TITLE_CLASS,
  PANEL_FOOTER_CLASS,
  SIDEBAR_FOOTER_INNER_CLASS,
} from './layoutConstants'

const MAIN_ROUTES = APP_ROUTES.filter((route) => route.key !== 'user-center')

interface SidebarProps {
  mobileOpen?: boolean
  collapsed?: boolean
  onToggleCollapse?: () => void
  onClose?: () => void
}

export function Sidebar({
  mobileOpen = false,
  collapsed = false,
  onToggleCollapse,
  onClose,
}: SidebarProps) {
  const { isAuthenticated } = useAuth()

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
      collapsed ? 'lg:justify-center lg:gap-0 lg:px-2' : ''
    } ${
      isActive
        ? 'bg-neutral-100 font-medium text-neutral-900'
        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 active:scale-[0.97]'
    }`

  const sidebarContent = (
    <>
      <div className={`${PANEL_HEADER_CLASS} ${collapsed ? 'lg:px-2' : ''}`}>
        <div className={PANEL_HEADER_ROW_CLASS}>
          <div className="relative h-10 min-w-0 flex-1 overflow-hidden lg:h-11">
            <div
              className={`absolute inset-0 flex flex-col justify-center transition-[opacity,transform] duration-300 ease-out ${
                collapsed
                  ? 'lg:pointer-events-none lg:-translate-x-1 lg:opacity-0'
                  : 'translate-x-0 opacity-100'
              }`}
            >
              <h1 className={`${PANEL_TITLE_CLASS} whitespace-nowrap`}>Everyday Writing</h1>
              <p className={`${PANEL_SUBTITLE_CLASS} whitespace-nowrap`}>每日英语写作</p>
            </div>
            <p
              className={`absolute inset-0 hidden items-center justify-center text-sm font-semibold tracking-tight text-neutral-900 transition-[opacity,transform] duration-300 ease-out lg:flex ${
                collapsed
                  ? 'translate-x-0 opacity-100'
                  : 'lg:pointer-events-none lg:translate-x-1 lg:opacity-0'
              }`}
              title="Everyday Writing"
              aria-hidden={!collapsed}
            >
              EW
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 lg:hidden"
              aria-label="关闭菜单"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <nav
        className={`flex-1 space-y-0.5 overflow-y-auto p-3 ${collapsed ? 'lg:p-2' : ''}`}
      >
        <NavLink
          to={isAuthenticated ? '/user-center' : '/login'}
          onClick={onClose}
          className={navLinkClass}
          title={collapsed ? (isAuthenticated ? '用户中心' : '立即登录') : undefined}
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
              <span
                className={`overflow-hidden whitespace-nowrap transition-[opacity,width] duration-300 ease-out ${
                  collapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'
                }`}
              >
                {isAuthenticated ? '用户中心' : '立即登录'}
              </span>
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
              title={collapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2 : 1.75}
                    className={isActive ? 'text-neutral-800' : 'text-neutral-400'}
                  />
                  <span
                    className={`overflow-hidden whitespace-nowrap transition-[opacity,width] duration-300 ease-out ${
                      collapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {onToggleCollapse && (
        <div className={`hidden lg:flex ${PANEL_FOOTER_CLASS}`}>
          <div className={SIDEBAR_FOOTER_INNER_CLASS}>
            <button
              type="button"
              onClick={onToggleCollapse}
              className={`flex h-9 w-full items-center rounded-lg text-sm text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900 ${
                collapsed ? 'justify-center px-2' : 'gap-2 px-3'
              }`}
              aria-label={collapsed ? '展开侧边栏' : '折叠侧边栏'}
              title={collapsed ? '展开侧边栏' : '折叠侧边栏'}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              <span
                className={`overflow-hidden whitespace-nowrap transition-[opacity,width] duration-300 ease-out ${
                  collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                }`}
              >
                收起菜单
              </span>
            </button>
          </div>
        </div>
      )}
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
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 flex-col overflow-hidden border-r border-neutral-200 bg-white transition-[width,transform] duration-300 ease-out lg:static lg:z-auto lg:translate-x-0 ${
          collapsed ? 'lg:w-16' : 'lg:w-56'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
