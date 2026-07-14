import { NavLink, useNavigate } from 'react-router-dom'
import { ArrowLeftRight, LogOut, X } from 'lucide-react'
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
  onClose?: () => void
}

export function AdminSidebar({ mobileOpen = false, onClose }: AdminSidebarProps) {
  const { roles, permissions, logout, user } = useAuth()
  const navigate = useNavigate()
  const canReturnToUser = hasUserRole(roles)
  const visibleRoutes = getVisibleAdminRoutes(permissions)

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
      isActive
        ? 'bg-neutral-100 font-medium text-neutral-900'
        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 active:scale-[0.97]'
    }`

  const sidebarContent = (
    <>
      <div className={PANEL_HEADER_CLASS}>
        <div className={PANEL_HEADER_ROW_CLASS}>
          <div className="min-w-0 flex-1">
            <h1 className={`${PANEL_TITLE_CLASS} whitespace-nowrap`}>管理后台</h1>
            <p className={`${PANEL_SUBTITLE_CLASS} truncate`}>
              {user?.nickname || user?.email || 'Administrator'}
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

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {visibleRoutes.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === '/admin'}
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
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className={PANEL_FOOTER_CLASS}>
        <div className={`${SIDEBAR_FOOTER_INNER_CLASS} flex-col gap-1 px-3 py-2`}>
          {canReturnToUser && (
            <button
              type="button"
              onClick={() => {
                onClose?.()
                navigate('/user-center')
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
            >
              <ArrowLeftRight size={16} className="text-neutral-400" />
              返回用户端
            </button>
          )}
          <button
            type="button"
            onClick={() => void logout().then(() => navigate(DEFAULT_PATH, { replace: true }))}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
          >
            <LogOut size={16} className="text-neutral-400" />
            退出登录
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <aside className="hidden w-56 shrink-0 flex-col border-r border-neutral-200 bg-white lg:flex">
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
