import { useState, type MouseEvent, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Settings2 } from 'lucide-react'
import { useAppAlert } from '../../context/AppAlertContext'
import { usePreferences } from '../../context/PreferencesContext'
import { useWritingFocus } from '../../context/WritingFocusContext'
import { useT } from '../../i18n'
import { Sidebar } from './Sidebar'
import { MobileBottomNav } from './MobileBottomNav'
import { VocabularySelectionAdd } from '../vocabulary/VocabularySelectionAdd'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { preferences, patchPreferences } = usePreferences()
  const { navigationLocked } = useWritingFocus()
  const { alert } = useAppAlert()
  const location = useLocation()
  const sidebarCollapsed = preferences.ui.sidebarCollapsed
  const t = useT()
  const settingsActive = location.pathname === '/settings'

  const guardSettingsClick = (event: MouseEvent) => {
    if (!navigationLocked) return
    event.preventDefault()
    void alert({
      title: t('nav.focusLockTitle'),
      message: t('nav.focusLockHint'),
      variant: 'info',
    })
  }

  return (
    <div className="flex h-full min-h-screen flex-col lg:h-screen lg:flex-row">
      <header className="flex shrink-0 items-center gap-2 border-b border-neutral-200 bg-white px-3 py-3 sm:gap-3 sm:px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          aria-label={t('common.openMenu')}
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-sans text-sm font-semibold text-neutral-900">Everyday Writing</p>
          <p className="font-sans text-xs text-neutral-400">{t('nav.brandSubtitle')}</p>
        </div>
        <Link
          to="/settings"
          onClick={guardSettingsClick}
          aria-label={t('nav.systemSettings')}
          aria-disabled={navigationLocked}
          className={`rounded-lg p-2 transition-colors ${
            settingsActive
              ? 'bg-neutral-100 text-neutral-900'
              : navigationLocked
                ? 'cursor-not-allowed text-neutral-300'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
          }`}
        >
          <Settings2 size={20} strokeWidth={settingsActive ? 2 : 1.75} />
        </Link>
      </header>

      <Sidebar
        mobileOpen={mobileMenuOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() =>
          patchPreferences((current) => ({
            ...current,
            ui: { ...current.ui, sidebarCollapsed: !current.ui.sidebarCollapsed },
          }))
        }
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
