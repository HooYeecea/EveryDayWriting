import { useState, type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { AdminSidebar } from './AdminSidebar'

const ADMIN_SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed'

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY) === 'true'
    } catch {
      return false
    }
  })

  const toggleCollapse = () => {
    setSidebarCollapsed((value) => {
      const next = !value
      try {
        localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, String(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  return (
    <div className="flex h-full min-h-screen flex-col lg:h-screen lg:flex-row">
      <header className="flex shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          aria-label="打开管理菜单"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <p className="truncate font-sans text-sm font-semibold text-neutral-900">管理后台</p>
          <p className="font-sans text-xs text-neutral-400">Everyday Writing Admin</p>
        </div>
      </header>

      <AdminSidebar
        mobileOpen={mobileMenuOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleCollapse}
        onClose={() => setMobileMenuOpen(false)}
      />

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#fafafa]">
        {children}
      </main>
    </div>
  )
}
