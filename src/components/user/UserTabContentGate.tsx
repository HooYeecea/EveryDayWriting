import type { ReactNode } from 'react'
import { BrandLoading, BRAND_LOADING_MIN_HEIGHT } from '../brand/BrandLoading'

export const USER_TAB_LOADING_MIN_HEIGHT = BRAND_LOADING_MIN_HEIGHT

/** @deprecated 使用 BrandLoading；保留别名以兼容用户中心既有调用 */
export function UserTabLoading({
  label = '加载中…',
  minHeight = USER_TAB_LOADING_MIN_HEIGHT,
}: {
  label?: string
  minHeight?: number
}) {
  return <BrandLoading label={label} minHeight={minHeight} />
}

/**
 * 首次就绪前只展示品牌加载态；子组件保持挂载以便拉数，就绪后一次切入正式内容。
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
      {!ready && <BrandLoading label={loadingLabel} minHeight={minHeight} />}
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
