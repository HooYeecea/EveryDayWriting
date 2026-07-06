import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
  /** 顶部品牌链接；传 null 时不跳转（强制改密等场景） */
  brandHref?: string | null
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  brandHref = '/writing',
}: AuthLayoutProps) {
  return (
    <div className="min-h-full bg-[#fafafa] px-4 py-5 sm:py-6">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-4 text-center sm:mb-5">
          {brandHref === null ? (
            <p className="text-base font-semibold text-neutral-900">Everyday Writing</p>
          ) : (
            <Link to={brandHref} className="text-base font-semibold text-neutral-900">
              Everyday Writing
            </Link>
          )}
          <p className="mt-0.5 text-xs text-neutral-400">每日英语写作</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <h1 className="text-lg font-semibold text-neutral-900 sm:text-xl">{title}</h1>
          <p className="mt-0.5 text-sm text-neutral-400">{subtitle}</p>
          <div className="mt-4">{children}</div>
          <div className="mt-4 border-t border-neutral-100 pt-4 text-sm text-neutral-500">
            {footer}
          </div>
        </div>
      </div>
    </div>
  )
}
