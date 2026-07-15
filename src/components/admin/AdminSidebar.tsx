import { NavLink, useNavigate } from 'react-router-dom'
import { ArrowLeftRight, ChevronLeft, ChevronRight, LogOut, X } from 'lucide-react'
import { getVisibleAdminRoutes } from '../../config/adminRoutes'
import { DEFAULT_PATH } from '../../config/routes'
import { useAuth } from '../../context/AuthContext'
import { hasUserRole } from '../../utils/roles'
import {
  PANEL_FOOTER_CLASS,
  PANEL_HEADER_CLASS,
  PANEL_HEADER_ROW_CLASS,
  PANEL_SUBTITLE_CLASS,
  PANEL_TITLE_CLASS,
  SIDEBAR_FOOTER_INNER_CLASS,
} from '../layout/layoutConstants'

interface AdminSidebarProps {
  mobileOpen?: boolean
  collapsed?: boolean
  onToggleCollapse?: () => void
  onClose?: () => void
}

export function AdminSidebar({
  mobileOpen = false,
  collapsed = false,
  onToggleCollapse,
  onClose,
}: AdminSidebarProps) {
  const { roles, permissions, logout, user } = useAuth()
  const navigate = useNavigate()
  const canReturnToUser = hasUserRole(roles)
  const visibleRoutes = getVisibleAdminRoutes(permissions)

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
      collapsed ? 'lg:justify-center lg:gap-0 lg:px-2' : ''
    } ${
      isActive
        ? 'bg-neutral-100 font-medium text-neutral-900'
        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 active:scale-[0.97]'
    }`

  const labelClass = `overflow-hidden whitespace-nowrap transition-[opacity,width] duration-300 ease-out ${
    collapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'
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
              <h1 className={`${PANEL_TITLE_CLASS} whitespace-nowrap`}>管理后台</h1>
              <p className={`${PANEL_SUBTITLE_CLASS} truncate`}>
                {user?.nickname || user?.email || 'Administrator'}
              </p>
            </div>
            <p
              className={`absolute inset-0 hidden items-center justify-center text-sm font-semibold tracking-tight text-neutral-900 transition-[opacity,transform] duration-300 ease-out lg:flex ${
                collapsed
                  ? 'translate-x-0 opacity-100'
                  : 'lg:pointer-events-none lg:translate-x-1 lg:opacity-0'
              }`}
              title="管理后台"
              aria-hidden={!collapsed}
            >
              管
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

      <nav className={`flex-1 space-y-0.5 overflow-y-auto p-3 ${collapsed ? 'lg:p-2' : ''}`}>
        {visibleRoutes.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === '/admin'}
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
                  <span className={labelClass}>{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className={`flex flex-col ${PANEL_FOOTER_CLASS} h-auto min-h-14 lg:h-auto`}>
        <div
          className={`${SIDEBAR_FOOTER_INNER_CLASS} flex-col gap-1 py-2 ${
            collapsed ? 'lg:px-2' : 'px-3'
          }`}
        >
          {canReturnToUser && (
            <button
              type="button"
              onClick={() => {
                onClose?.()
                navigate('/user-center')
              }}
              className={`flex w-full items-center rounded-lg py-2 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 ${
                collapsed ? 'lg:justify-center lg:px-2' : 'gap-2 px-2'
              }`}
              title="返回用户端"
            >
              <ArrowLeftRight size={16} className="shrink-0 text-neutral-400" />
              <span className={labelClass}>返回用户端</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => void logout().then(() => navigate(DEFAULT_PATH, { replace: true }))}
            className={`flex w-full items-center rounded-lg py-2 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 ${
              collapsed ? 'lg:justify-center lg:px-2' : 'gap-2 px-2'
            }`}
            title="退出登录"
          >
            <LogOut size={16} className="shrink-0 text-neutral-400" />
            <span className={labelClass}>退出登录</span>
          </button>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={`mt-0.5 hidden h-9 w-full items-center rounded-lg text-sm text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900 lg:flex ${
                collapsed ? 'justify-center px-2' : 'gap-2 px-2'
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
          )}
        </div>
      </div>
    </>
  )

  return (
    <>
      <aside
        className={`hidden shrink-0 flex-col overflow-hidden border-r border-neutral-200 bg-white transition-[width] duration-300 ease-out lg:flex ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            aria-label="关闭遮罩"
            onClick={onClose}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 max-w-[85vw] flex-col bg-white shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
