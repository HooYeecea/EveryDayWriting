import { useLayoutEffect, useRef } from 'react'

/** 数据首次就绪时回调一次（用于页面/Tab 门控；layout 阶段触发，避免多闪一帧加载壳） */
export function useReportReady(isReady: boolean, onReady?: () => void) {
  const reportedRef = useRef(false)

  useLayoutEffect(() => {
    if (!isReady || reportedRef.current) return
    reportedRef.current = true
    onReady?.()
  }, [isReady, onReady])
}
