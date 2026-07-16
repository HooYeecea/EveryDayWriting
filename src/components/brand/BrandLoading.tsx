import type { ReactNode } from 'react'
import { EwLogo } from './EwLogo'

export const BRAND_LOADING_MIN_HEIGHT = 320

/** 品牌加载动画：EW 印记 + 呼吸环 + 笔触进度 */
export function BrandLoading({
  label = '加载中…',
  minHeight = BRAND_LOADING_MIN_HEIGHT,
  className = '',
}: {
  label?: string
  minHeight?: number
  className?: string
}) {
  return (
    <div
      className={`brand-loading flex flex-col items-center justify-center gap-4 rounded-2xl border border-neutral-200 bg-white px-6 text-center shadow-sm ${className}`}
      style={{ minHeight }}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="brand-loading__stage relative flex h-16 w-16 items-center justify-center">
        <span className="brand-loading__ring" aria-hidden />
        <span className="brand-loading__ring brand-loading__ring--delay" aria-hidden />
        <EwLogo className="brand-loading__mark relative z-[1] h-11 w-11" />
      </div>
      <div className="space-y-1.5">
        <p className="font-sans text-sm font-medium tracking-wide text-neutral-800">{label}</p>
        <p className="font-sans text-[11px] tracking-[0.18em] text-neutral-400 uppercase">
          Everyday Writing
        </p>
      </div>
      <div className="brand-loading__bar" aria-hidden>
        <span className="brand-loading__bar-fill" />
      </div>
    </div>
  )
}

/**
 * 首次就绪前展示品牌加载态；子树保持挂载以便请求，就绪后一次切入内容。
 * 用 opacity 隐藏，避免子层 visibility:visible 穿透。
 */
export function BrandContentGate({
  ready,
  children,
  loadingLabel,
  minHeight = BRAND_LOADING_MIN_HEIGHT,
}: {
  ready: boolean
  children: ReactNode
  loadingLabel?: string
  minHeight?: number
}) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {!ready && (
        <BrandLoading
          label={loadingLabel}
          minHeight={minHeight}
          className="absolute inset-0 z-[1] min-h-full rounded-none border-0 shadow-none"
        />
      )}
      <div
        className={
          ready
            ? 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'
            : 'pointer-events-none absolute inset-0 opacity-0'
        }
        aria-hidden={!ready}
      >
        {children}
      </div>
    </div>
  )
}
