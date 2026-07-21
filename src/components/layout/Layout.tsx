import { useEffect, useState, type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { MobileBottomNav } from './MobileBottomNav'
import { VocabularySelectionAdd } from '../vocabulary/VocabularySelectionAdd'

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed))
    } catch {
      // ignore
    }
  }, [sidebarCollapsed])

  return (
    <div className="flex h-full min-h-screen flex-col lg:h-screen lg:flex-row">
      <header className="flex shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          aria-label="打开菜单"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <p className="truncate font-sans text-sm font-semibold text-neutral-900">Everyday Writing</p>
          <p className="font-sans text-xs text-neutral-400">每日英语写作</p>
        </div>
      </header>

      <Sidebar
        mobileOpen={mobileMenuOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
        onClose={() => setMobileMenuOpen(false)}
      />

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#fafafa] pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <VocabularySelectionAdd
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          hint=""
        >
          {children}
        </VocabularySelectionAdd>
      </main>

      <MobileBottomNav />
    </div>
  )
}
