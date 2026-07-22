import { useEffect, useRef, useState } from 'react'
import { callAiProxy } from '../api/ai'
import { loadAiAssistSettings } from '../storage/aiSettingsStorage'
import type { RealtimeAssistTip } from '../types'
import { htmlToPlainText, parseRealtimeAssistResult } from '../utils/realtimeAssist'

const DEBOUNCE_MS = 2500
/** 正文过短不请求，避免无意义调用 */
const MIN_PLAIN_CHARS = 28
/** 控制发给模型的正文长度，降低延迟与 Token */
const MAX_PLAIN_CHARS = 3500

export type RealtimeAssistStatus = 'idle' | 'waiting' | 'loading' | 'ready' | 'error'

export interface UseRealtimeWritingAssistResult {
  tips: RealtimeAssistTip[]
  status: RealtimeAssistStatus
  errorMessage: string | null
  /** tips 最近一次成功更新的时间戳；用于未读角标 */
  updatedAt: number
}

interface Options {
  enabled: boolean
  editorHtml: string
}

export function useRealtimeWritingAssist({
  enabled,
  editorHtml,
}: Options): UseRealtimeWritingAssistResult {
  const [tips, setTips] = useState<RealtimeAssistTip[]>([])
  const [status, setStatus] = useState<RealtimeAssistStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState(0)

  const requestIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const lastSentRef = useRef('')

  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort()
      abortRef.current = null
      requestIdRef.current += 1
      lastSentRef.current = ''
      setTips([])
      setStatus('idle')
      setErrorMessage(null)
      return
    }

    const plain = htmlToPlainText(editorHtml)
    if (plain.length < MIN_PLAIN_CHARS) {
      abortRef.current?.abort()
      abortRef.current = null
      requestIdRef.current += 1
      lastSentRef.current = ''
      setTips([])
      setStatus('idle')
      setErrorMessage(null)
      return
    }

    const clipped =
      plain.length > MAX_PLAIN_CHARS ? plain.slice(plain.length - MAX_PLAIN_CHARS) : plain

    if (clipped === lastSentRef.current) {
      return
    }

    // 正文已变：取消上一轮请求，避免过期结果覆盖
    abortRef.current?.abort()
    abortRef.current = null

    setStatus('waiting')

    const timer = window.setTimeout(() => {
      void (async () => {
        if (clipped === lastSentRef.current) return

        const controller = new AbortController()
        abortRef.current = controller
        const requestId = ++requestIdRef.current

        setStatus('loading')
        setErrorMessage(null)

        try {
          const settings = loadAiAssistSettings()
          const hasOwnKey = Boolean(settings.encryptedKey)
          const providerId = hasOwnKey ? settings.providerId || 'free' : 'free'
          const modelId = hasOwnKey ? settings.modelId || 'free' : 'free'

          const result = await callAiProxy(
            'realtime_assist',
            {
              providerId,
              modelId,
              userContent: clipped,
            },
            hasOwnKey ? settings.encryptedKey : undefined,
            controller.signal,
          )

          if (requestId !== requestIdRef.current) return

          const parsed = parseRealtimeAssistResult(result.content ?? '')
          lastSentRef.current = clipped
          setTips(parsed.tips)
          setUpdatedAt(Date.now())
          setStatus('ready')
          setErrorMessage(null)
        } catch (err) {
          if (controller.signal.aborted || requestId !== requestIdRef.current) return
          const message = err instanceof Error ? err.message : '实时辅助请求失败'
          setStatus('error')
          setErrorMessage(message)
        }
      })()
    }, DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [enabled, editorHtml])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  return { tips, status, errorMessage, updatedAt }
}
