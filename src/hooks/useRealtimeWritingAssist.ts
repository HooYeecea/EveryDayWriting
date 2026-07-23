import { useCallback, useEffect, useRef, useState } from 'react'
import { callAiProxy, callAiProxyStream } from '../api/ai'
import { loadAiAssistSettings } from '../storage/aiSettingsStorage'
import type { RealtimeAssistTip } from '../types'
import {
  extractStreamingTips,
  htmlToPlainText,
  parseRealtimeAssistResult,
} from '../utils/realtimeAssist'

const DEBOUNCE_MS = 2500
/** 正文过短不请求，避免无意义调用 */
const MIN_PLAIN_CHARS = 28
/** 控制发给模型的正文长度，降低延迟与 Token */
const MAX_PLAIN_CHARS = 3500

export type RealtimeAssistStatus = 'idle' | 'waiting' | 'loading' | 'ready' | 'error'

/** 一次停笔请求产生的建议批次（按时间追加，不覆盖） */
export interface RealtimeAssistTipBatch {
  id: string
  createdAt: number
  tips: RealtimeAssistTip[]
  /** 流式进行中：tips 会逐步增长 */
  streaming?: boolean
}

export interface UseRealtimeWritingAssistResult {
  batches: RealtimeAssistTipBatch[]
  status: RealtimeAssistStatus
  errorMessage: string | null
  /** 最近一次成功追加的时间戳；用于未读角标 */
  updatedAt: number
  /** 最近一批新增的建议条数（角标用） */
  lastBatchTipCount: number
  clearHistory: () => void
  removeBatch: (batchId: string) => void
}

interface Options {
  enabled: boolean
  editorHtml: string
  /** 递增时清空历史（如点击「重写」） */
  clearNonce?: number
}

function createBatchId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `batch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function tipsSignature(tips: RealtimeAssistTip[]): string {
  return tips
    .map((tip) => `${tip.type}|${tip.original}|${tip.suggestion}|${tip.note}`)
    .join('\n')
}

export function useRealtimeWritingAssist({
  enabled,
  editorHtml,
  clearNonce = 0,
}: Options): UseRealtimeWritingAssistResult {
  const [batches, setBatches] = useState<RealtimeAssistTipBatch[]>([])
  const [status, setStatus] = useState<RealtimeAssistStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState(0)
  const [lastBatchTipCount, setLastBatchTipCount] = useState(0)

  const requestIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const lastSentRef = useRef('')
  const clearNonceRef = useRef(clearNonce)

  const resetRequestState = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    requestIdRef.current += 1
    lastSentRef.current = ''
    setStatus('idle')
    setErrorMessage(null)
  }, [])

  const clearHistory = useCallback(() => {
    resetRequestState()
    setBatches([])
    setUpdatedAt(0)
    setLastBatchTipCount(0)
  }, [resetRequestState])

  const removeBatch = useCallback((batchId: string) => {
    setBatches((prev) => prev.filter((batch) => batch.id !== batchId))
  }, [])

  useEffect(() => {
    if (clearNonce === clearNonceRef.current) return
    clearNonceRef.current = clearNonce
    clearHistory()
  }, [clearNonce, clearHistory])

  useEffect(() => {
    if (!enabled) {
      clearHistory()
      return
    }

    const plain = htmlToPlainText(editorHtml)
    if (plain.length < MIN_PLAIN_CHARS) {
      // 正文过短：暂停请求，但保留已累积的建议
      abortRef.current?.abort()
      abortRef.current = null
      requestIdRef.current += 1
      lastSentRef.current = ''
      setStatus('idle')
      setErrorMessage(null)
      return
    }

    const clipped =
      plain.length > MAX_PLAIN_CHARS ? plain.slice(plain.length - MAX_PLAIN_CHARS) : plain

    if (clipped === lastSentRef.current) {
      return
    }

    // 正文已变：取消上一轮请求，避免过期结果写入
    abortRef.current?.abort()
    abortRef.current = null
    setBatches((prev) => prev.filter((batch) => !batch.streaming))

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
          const payload = {
            providerId,
            modelId,
            userContent: clipped,
          }
          const encryptedKey = hasOwnKey ? settings.encryptedKey : undefined

          if (settings.realtimeStreamEnabled) {
            const batchId = createBatchId()
            const createdAt = Date.now()
            let accumulated = ''
            let lastSig = ''

            setBatches((prev) => [
              ...prev,
              { id: batchId, createdAt, tips: [], streaming: true },
            ])

            const content = await callAiProxyStream(
              'realtime_assist',
              payload,
              encryptedKey,
              controller.signal,
              (event) => {
                if (requestId !== requestIdRef.current) return
                if (event.type !== 'delta') return

                accumulated += event.text
                const partialTips = extractStreamingTips(accumulated)
                const sig = tipsSignature(partialTips)
                if (sig === lastSig) return
                lastSig = sig

                setBatches((prev) =>
                  prev.map((batch) =>
                    batch.id === batchId
                      ? { ...batch, tips: partialTips, streaming: true }
                      : batch,
                  ),
                )
              },
            )

            if (requestId !== requestIdRef.current) return

            const parsed = parseRealtimeAssistResult(content || accumulated)
            lastSentRef.current = clipped
            setStatus('ready')
            setErrorMessage(null)
            setBatches((prev) =>
              prev.map((batch) =>
                batch.id === batchId
                  ? { ...batch, tips: parsed.tips, streaming: false }
                  : batch,
              ),
            )
            setLastBatchTipCount(parsed.tips.length)
            setUpdatedAt(createdAt)
            return
          }

          const result = await callAiProxy(
            'realtime_assist',
            payload,
            encryptedKey,
            controller.signal,
          )

          if (requestId !== requestIdRef.current) return

          const parsed = parseRealtimeAssistResult(result.content ?? '')
          lastSentRef.current = clipped
          setStatus('ready')
          setErrorMessage(null)

          const createdAt = Date.now()
          setBatches((prev) => [
            ...prev,
            {
              id: createBatchId(),
              createdAt,
              tips: parsed.tips,
            },
          ])
          setLastBatchTipCount(parsed.tips.length)
          setUpdatedAt(createdAt)
        } catch (err) {
          if (controller.signal.aborted || requestId !== requestIdRef.current) {
            setBatches((prev) => prev.filter((batch) => !batch.streaming))
            return
          }
          const message = err instanceof Error ? err.message : '实时辅助请求失败'
          setStatus('error')
          setErrorMessage(message)
          setBatches((prev) =>
            prev
              .filter((batch) => !(batch.streaming && batch.tips.length === 0))
              .map((batch) => (batch.streaming ? { ...batch, streaming: false } : batch)),
          )
        }
      })()
    }, DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [enabled, editorHtml, clearHistory])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  return {
    batches,
    status,
    errorMessage,
    updatedAt,
    lastBatchTipCount,
    clearHistory,
    removeBatch,
  }
}
