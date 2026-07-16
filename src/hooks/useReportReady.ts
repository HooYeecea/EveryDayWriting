import { useEffect, useRef } from 'react'

/** 数据首次就绪时回调一次（用于页面/Tab 门控） */
export function useReportReady(isReady: boolean, onReady?: () => void) {
  const reportedRef = useRef(false)

  useEffect(() => {
    if (!isReady || reportedRef.current) return
    reportedRef.current = true
    onReady?.()
  }, [isReady, onReady])
}
