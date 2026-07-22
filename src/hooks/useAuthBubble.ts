import { useCallback, useEffect, useRef, useState } from 'react'

/** 鉴权页气泡提示：展示后自动消失 */
export function useAuthBubble(durationMs = 3000) {
  const [message, setMessage] = useState('')
  const timerRef = useRef<number | null>(null)

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setMessage('')
  }, [])

  const show = useCallback(
    (next: string) => {
      const text = next.trim()
      if (!text) {
        clear()
        return
      }
      setMessage(text)
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        setMessage('')
        timerRef.current = null
      }, durationMs)
    },
    [clear, durationMs],
  )

  useEffect(() => () => clear(), [clear])

  return { message, show, clear }
}
