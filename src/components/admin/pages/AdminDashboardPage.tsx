import { Link } from 'react-router-dom'
import { getVisibleAdminRoutes } from '../../../config/adminRoutes'
import { useAuth } from '../../../context/AuthContext'
import { AdminCard, AdminEmpty, AdminPageBody, AdminPageHeader } from '../AdminUi'

export function AdminDashboardPage() {
  const { permissions } = useAuth()
  const links = getVisibleAdminRoutes(permissions).filter((route) => route.path !== '/admin')

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader title="管理概览" description="Everyday Writing 运营与系统管理入口" />
      <AdminPageBody>
        <AdminCard>
          <h3 className="font-sans text-sm font-medium text-neutral-900">快捷入口</h3>
          <p className="mt-1 text-sm text-neutral-400">
            仅展示你当前角色拥有权限的模块。
          </p>
          {links.length === 0 ? (
            <AdminEmpty message="当前账号没有任何可管理的模块权限" />
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {links.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
                >
                  <p className="font-medium text-neutral-900">{item.label}</p>
                  <p className="mt-1 text-xs text-neutral-400">{item.path}</p>
                </Link>
              ))}
            </div>
          )}
        </AdminCard>
      </AdminPageBody>
    </div>
  )
}
