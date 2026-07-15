import { useCallback, useEffect, useRef, useState } from 'react'

type AutoRefreshControls = {
  /** Manual refresh: runs `refresh` and resets the countdown. */
  refreshNow: () => void
  /** Restart the countdown without fetching. */
  resetTimer: () => void
}

/**
 * Periodically calls `refresh`. Manual `refreshNow` (or `resetTimer`)
 * restarts the wait so the next auto run only fires after a full idle interval.
 */
export function useAutoRefresh(
  refresh: () => void | Promise<void>,
  intervalMs: number,
  enabled = true,
): AutoRefreshControls {
  const refreshRef = useRef(refresh)
  refreshRef.current = refresh

  const inFlightRef = useRef(false)
  const [epoch, setEpoch] = useState(0)

  const resetTimer = useCallback(() => {
    setEpoch((n) => n + 1)
  }, [])

  const refreshNow = useCallback(() => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    void Promise.resolve(refreshRef.current()).finally(() => {
      inFlightRef.current = false
      setEpoch((n) => n + 1)
    })
  }, [])

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return

    const id = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return
      refreshNow()
    }, intervalMs)

    return () => window.clearInterval(id)
  }, [enabled, intervalMs, epoch, refreshNow])

  return { refreshNow, resetTimer }
}
