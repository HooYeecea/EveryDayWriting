import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#fafafa]">
        {children}
      </main>
    </div>
  )
}
