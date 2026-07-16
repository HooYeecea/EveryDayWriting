import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

export const USER_TAB_LOADING_MIN_HEIGHT = 280

/** 用户中心 Tab 首次加载占位：固定高度，避免内容到位前视口抖动 */
export function UserTabLoading({
  label = '加载中…',
  minHeight = USER_TAB_LOADING_MIN_HEIGHT,
}: {
  label?: string
  minHeight?: number
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-200 bg-white text-sm text-neutral-400 shadow-sm"
      style={{ minHeight }}
      role="status"
      aria-live="polite"
    >
      <Loader2 size={22} className="animate-spin text-neutral-300" strokeWidth={1.75} />
      <span>{label}</span>
    </div>
  )
}

/**
 * 首次就绪前只展示稳定加载态；子组件保持挂载以便拉数，就绪后一次切入正式内容。
 * 用 opacity 隐藏（不用 visibility:hidden），避免打卡日历等子层 visibility:visible 穿透。
 */
export function UserTabContentGate({
  ready,
  children,
  loadingLabel,
  minHeight = USER_TAB_LOADING_MIN_HEIGHT,
}: {
  ready: boolean
  children: ReactNode
  loadingLabel?: string
  minHeight?: number
}) {
  return (
    <div className="relative">
      {!ready && <UserTabLoading label={loadingLabel} minHeight={minHeight} />}
      <div
        className={
          ready
            ? undefined
            : 'pointer-events-none absolute inset-x-0 top-0 opacity-0'
        }
        aria-hidden={!ready}
      >
        {children}
      </div>
    </div>
  )
}
