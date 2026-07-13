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
    <div className="flex min-h-full items-start justify-center bg-[#fafafa] px-4 pt-16 sm:pt-24 pb-10 sm:pb-16">
      <div className="w-full max-w-sm">
        {/* ── Brand ── */}
        <div className="mb-8 text-center">
          {brandHref === null ? (
            <p className="font-sans text-xl font-bold tracking-tight text-neutral-900">
              Everyday Writing
            </p>
          ) : (
            <Link
              to={brandHref}
              className="font-sans text-xl font-bold tracking-tight text-neutral-900"
            >
              Everyday Writing
            </Link>
          )}
          <p className="mt-1 font-sans text-xs tracking-wide text-neutral-400">
            每日英语写作
          </p>
        </div>

        {/* ── Card ── */}
        <div className="animate-fade-in-up rounded-xl border border-neutral-200 bg-white px-6 py-8 shadow-sm">
          {/* ── TS-style 4px top accent ── */}
          <div className="-mx-6 -mt-8 mb-8 border-t-4 border-neutral-900" />

          {/* ── Title ── */}
          <h1 className="mb-6 text-center font-sans text-2xl font-bold tracking-wide text-neutral-900">
            {title}
          </h1>

          {/* ── Subtitle (optional) ── */}
          {subtitle ? (
            <p className="-mt-4 mb-6 text-center font-sans text-sm text-neutral-400">
              {subtitle}
            </p>
          ) : null}

          {/* ── Form ── */}
          <div className="space-y-4">{children}</div>

          {/* ── Footer ── */}
          <div className="mt-6 border-t border-neutral-100 pt-5 text-center text-sm text-neutral-500">
            {footer}
          </div>
        </div>
      </div>
    </div>
  )
}
