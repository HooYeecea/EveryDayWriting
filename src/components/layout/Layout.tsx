import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import type { MenuKey } from '../../types'

interface LayoutProps {
  activeKey: MenuKey
  onMenuSelect: (key: MenuKey) => void
  children: ReactNode
}

export function Layout({ activeKey, onMenuSelect, children }: LayoutProps) {
  return (
    <div className="flex h-full min-h-screen">
      <Sidebar activeKey={activeKey} onSelect={onMenuSelect} />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#fafafa]">
        {children}
      </main>
    </div>
  )
}
