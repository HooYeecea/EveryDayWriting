import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/writing" className="text-base font-semibold text-neutral-900">
            Everyday Writing
          </Link>
          <p className="mt-1 text-xs text-neutral-400">每日英语写作</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-neutral-900">{title}</h1>
          <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>

        <div className="mt-6 text-center text-sm text-neutral-500">{footer}</div>
      </div>
    </div>
  )
}
