import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Eraser,
  FileCheck,
  Loader2,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useConfirmDialog } from '../common/ConfirmDialog'
import { useT } from '../../i18n'
import {
  loadAiAssistSettings,
  type RealtimeStreamEffect,
} from '../../storage/aiSettingsStorage'
import type { RealtimeAssistTip } from '../../types'
import type {
  RealtimeAssistStatus,
  RealtimeAssistTipBatch,
} from '../../hooks/useRealtimeWritingAssist'

const TYPE_LABEL_KEY = {
  grammar: 'assist.realtime.type.grammar',
  wording: 'assist.realtime.type.wording',
  polish: 'assist.realtime.type.polish',
} as const

const HEIGHT_STORAGE_KEY = 'ew-realtime-assist-panel-height'
const DEFAULT_HEIGHT = 280
const MIN_HEIGHT = 160
const MAX_HEIGHT = 520

interface RealtimeAssistTipsProps {
  enabled: boolean
  batches: RealtimeAssistTipBatch[]
  status: RealtimeAssistStatus
  errorMessage: string | null
  onClearAll: () => void
  onRemoveBatch: (batchId: string) => void
  compact?: boolean
}

function formatBatchTime(createdAt: number) {
  try {
    return new Date(createdAt).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return ''
  }
}

function loadStoredHeight(): number {
  try {
    const raw = sessionStorage.getItem(HEIGHT_STORAGE_KEY)
    if (!raw) return DEFAULT_HEIGHT
    const value = Number(raw)
    if (!Number.isFinite(value)) return DEFAULT_HEIGHT
    return Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, value))
  } catch {
    return DEFAULT_HEIGHT
  }
}

function TypewriterText({ text, active }: { text: string; active: boolean }) {
  const [visible, setVisible] = useState(active ? '' : text)

  useEffect(() => {
    if (!active) {
      setVisible(text)
      return
    }
    setVisible('')
    if (!text) return

    let index = 0
    const step = Math.max(1, Math.ceil(text.length / 48))
    const timer = window.setInterval(() => {
      index = Math.min(text.length, index + step)
      setVisible(text.slice(0, index))
      if (index >= text.length) window.clearInterval(timer)
    }, 28)

    return () => window.clearInterval(timer)
  }, [text, active])

  return <>{visible}</>
}

function TipCard({
  tip,
  typeLabel,
  effect,
  animate,
}: {
  tip: RealtimeAssistTip
  typeLabel: (type: string) => string
  effect: RealtimeStreamEffect
  animate: boolean
}) {
  // 仅在首次挂载时锁定动效，避免后续 tips 追加导致 animate 被清掉而打断打字机
  const [shouldAnimate] = useState(animate)
  const motionClass =
    shouldAnimate && (effect === 'tips-fade' || effect === 'fade')
      ? 'animate-realtime-tip-fade'
      : ''

  return (
    <li
      className={`rounded-lg border border-neutral-200 bg-white px-2.5 py-2 ${motionClass}`.trim()}
    >
      <div className="flex items-center gap-1.5">
        <Sparkles size={12} className="shrink-0 text-neutral-400" strokeWidth={1.75} />
        <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
          {typeLabel(tip.type)}
        </span>
      </div>
      {tip.original ? (
        <p
          className={`mt-1 text-[11px] leading-relaxed text-neutral-500 ${
            tip.suggestion ? 'line-through decoration-neutral-300' : ''
          }`}
        >
          {tip.original}
        </p>
      ) : null}
      {tip.suggestion ? (
        <p className="mt-0.5 text-xs leading-relaxed text-neutral-800">
          {effect === 'typewriter' && shouldAnimate ? (
            <TypewriterText text={tip.suggestion} active />
          ) : (
            tip.suggestion
          )}
        </p>
      ) : null}
      {tip.note ? (
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
          {effect === 'typewriter' && shouldAnimate ? (
            <TypewriterText text={tip.note} active />
          ) : (
            tip.note
          )}
        </p>
      ) : null}
      {!tip.suggestion && !tip.note && tip.original ? (
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">—</p>
      ) : null}
    </li>
  )
}

export function RealtimeAssistTips({
  enabled,
  batches,
  status,
  errorMessage,
  onClearAll,
  onRemoveBatch,
  compact = false,
}: RealtimeAssistTipsProps) {
  const t = useT()
  const { confirm, dialog: confirmDialog } = useConfirmDialog()
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set())
  const [panelHeight, setPanelHeight] = useState(loadStoredHeight)
  const [isResizing, setIsResizing] = useState(false)
  const [streamEffect, setStreamEffect] = useState<RealtimeStreamEffect>(
    () => loadAiAssistSettings().realtimeStreamEffect,
  )
  const sectionRef = useRef<HTMLElement>(null)
  const revealedTipKeysRef = useRef<Set<string>>(new Set())
  const [freshTipKeys, setFreshTipKeys] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setStreamEffect(loadAiAssistSettings().realtimeStreamEffect)
  }, [batches, status])

  useEffect(() => {
    const fresh = new Set<string>()
    for (const batch of batches) {
      batch.tips.forEach((tip, index) => {
        const tipKey = `${batch.id}-${index}-${tip.type}-${tip.original}-${tip.suggestion}`
        if (!revealedTipKeysRef.current.has(tipKey)) {
          fresh.add(tipKey)
          revealedTipKeysRef.current.add(tipKey)
        }
      })
    }
    setFreshTipKeys(fresh)
  }, [batches])

  useEffect(() => {
    setCollapsedIds((prev) => {
      const next = new Set<string>()
      for (const batch of batches) {
        if (prev.has(batch.id)) next.add(batch.id)
      }
      return next
    })
  }, [batches])

  if (!enabled) return null

  const typeLabel = (type: string) => {
    if (type === 'grammar' || type === 'wording' || type === 'polish') {
      return t(TYPE_LABEL_KEY[type])
    }
    return type
  }

  const hasBatches = batches.length > 0

  const toggleBatch = (batchId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(batchId)) next.delete(batchId)
      else next.add(batchId)
      return next
    })
  }

  const handleClearAll = async () => {
    const confirmed = await confirm({
      title: t('assist.realtime.clearAllTitle'),
      message: t('assist.realtime.clearAllMessage'),
      confirmLabel: t('assist.realtime.clearConfirm'),
      cancelLabel: t('common.cancel'),
      variant: 'warning',
    })
    if (confirmed) {
      revealedTipKeysRef.current.clear()
      setFreshTipKeys(new Set())
      onClearAll()
    }
  }

  const handleRemoveBatch = async (batchId: string) => {
    const confirmed = await confirm({
      title: t('assist.realtime.clearBatchTitle'),
      message: t('assist.realtime.clearBatchMessage'),
      confirmLabel: t('assist.realtime.clearConfirm'),
      cancelLabel: t('common.cancel'),
      variant: 'warning',
    })
    if (confirmed) onRemoveBatch(batchId)
  }

  const handleResizePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    const startY = event.clientY
    const startHeight = panelHeight
    setIsResizing(true)

    const previousUserSelect = document.body.style.userSelect
    const previousCursor = document.body.style.cursor
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'row-resize'

    const onMove = (moveEvent: PointerEvent) => {
      const next = Math.min(
        MAX_HEIGHT,
        Math.max(MIN_HEIGHT, startHeight + (moveEvent.clientY - startY)),
      )
      setPanelHeight(next)
    }

    const onUp = () => {
      setIsResizing(false)
      document.body.style.userSelect = previousUserSelect
      document.body.style.cursor = previousCursor
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      setPanelHeight((current) => {
        try {
          sessionStorage.setItem(HEIGHT_STORAGE_KEY, String(current))
        } catch {
          // ignore
        }
        return current
      })
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  return (
    <>
      <section
        ref={sectionRef}
        style={{ height: panelHeight }}
        className={`relative flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 ${
          compact ? 'p-3 pb-4' : 'p-3.5 pb-4'
        }`}
      >
        <div className="shrink-0">
          <div className="flex items-center gap-2">
            <FileCheck size={16} className="shrink-0 text-neutral-500" strokeWidth={1.75} />
            <h4 className="min-w-0 flex-1 text-xs font-medium text-neutral-800">
              {t('assist.realtime.title')}
            </h4>
            {status === 'waiting' && (
              <span className="text-[10px] text-neutral-400">{t('assist.realtime.waiting')}</span>
            )}
            {status === 'loading' && (
              <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500">
                <Loader2 size={12} className="animate-spin" />
                {t('assist.realtime.loading')}
              </span>
            )}
            {hasBatches && (
              <button
                type="button"
                onClick={() => void handleClearAll()}
                className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium text-neutral-500 transition-colors hover:bg-neutral-200/70 hover:text-neutral-800"
                aria-label={t('assist.realtime.clearAll')}
                title={t('assist.realtime.clearAll')}
              >
                <Eraser size={12} strokeWidth={1.75} />
                {t('assist.realtime.clearAll')}
              </button>
            )}
          </div>

          <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500">
            {t('assist.realtime.hint')}
          </p>

          {status === 'error' && errorMessage && (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-800">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="mt-2.5 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5">
          {!hasBatches && status === 'ready' && (
            <p className="text-[11px] text-neutral-400">{t('assist.realtime.empty')}</p>
          )}

          {!hasBatches && (status === 'idle' || status === 'waiting' || status === 'loading') && (
            <p className="text-[11px] text-neutral-400">{t('assist.realtime.idle')}</p>
          )}

          {hasBatches && (
            <div className="space-y-3 pb-1">
              {batches.map((batch) => {
                const collapsed = collapsedIds.has(batch.id)
                return (
                  <div key={batch.id}>
                    <div className="mb-1.5 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleBatch(batch.id)}
                        className="inline-flex shrink-0 items-center justify-center rounded-md p-0.5 text-neutral-400 transition-colors hover:bg-neutral-200/70 hover:text-neutral-700"
                        aria-expanded={!collapsed}
                        aria-label={
                          collapsed ? t('assist.realtime.expand') : t('assist.realtime.collapse')
                        }
                        title={
                          collapsed ? t('assist.realtime.expand') : t('assist.realtime.collapse')
                        }
                      >
                        {collapsed ? (
                          <ChevronRight size={14} strokeWidth={1.75} />
                        ) : (
                          <ChevronDown size={14} strokeWidth={1.75} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleBatch(batch.id)}
                        className="min-w-0 flex-1 truncate text-left text-[10px] font-medium tracking-wide text-neutral-400 hover:text-neutral-600"
                      >
                        {t('assist.realtime.roundAt', { time: formatBatchTime(batch.createdAt) })}
                        {batch.streaming ? (
                          <span className="ml-1 text-amber-600/80">
                            · {t('assist.realtime.streaming')}
                          </span>
                        ) : null}
                        {collapsed ? (
                          <span className="ml-1 text-neutral-300">({batch.tips.length})</span>
                        ) : null}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRemoveBatch(batch.id)}
                        className="inline-flex shrink-0 items-center justify-center rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-200/70 hover:text-neutral-700"
                        aria-label={t('assist.realtime.clearBatch')}
                        title={t('assist.realtime.clearBatch')}
                      >
                        <Trash2 size={12} strokeWidth={1.75} />
                      </button>
                    </div>
                    {!collapsed &&
                      (batch.tips.length > 0 ? (
                        <ul
                          className={
                            streamEffect === 'fade' && batch.streaming === false
                              ? 'space-y-2 animate-realtime-tip-fade'
                              : 'space-y-2'
                          }
                        >
                          {batch.tips.map((tip, index) => {
                            const tipKey = `${batch.id}-${index}-${tip.type}-${tip.original}-${tip.suggestion}`
                            return (
                              <TipCard
                                key={tipKey}
                                tip={tip}
                                typeLabel={typeLabel}
                                effect={streamEffect}
                                animate={freshTipKeys.has(tipKey)}
                              />
                            )
                          })}
                        </ul>
                      ) : (
                        <p className="rounded-lg border border-dashed border-neutral-200 bg-white/70 px-2.5 py-2 text-[11px] text-neutral-400">
                          {batch.streaming
                            ? t('assist.realtime.streamingEmpty')
                            : t('assist.realtime.empty')}
                        </p>
                      ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label={t('assist.realtime.resizeAria')}
          aria-valuemin={MIN_HEIGHT}
          aria-valuemax={MAX_HEIGHT}
          aria-valuenow={panelHeight}
          tabIndex={0}
          onPointerDown={handleResizePointerDown}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
            event.preventDefault()
            const delta = event.key === 'ArrowDown' ? 16 : -16
            setPanelHeight((current) => {
              const next = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, current + delta))
              try {
                sessionStorage.setItem(HEIGHT_STORAGE_KEY, String(current))
              } catch {
                // ignore
              }
              return next
            })
          }}
          className="absolute inset-x-0 bottom-0 z-10 flex h-3 cursor-row-resize touch-none items-center justify-center"
        >
          <span
            className={`h-1 w-8 rounded-full transition-colors duration-200 ${
              isResizing ? 'bg-neutral-500' : 'bg-neutral-300/90 hover:bg-neutral-400'
            }`}
          />
        </div>
      </section>
      {confirmDialog}
    </>
  )
}

export function RealtimeAssistBadge({
  count = 0,
  analyzing = false,
  analyzingLabel,
  placement = 'icon',
}: {
  count?: number
  analyzing?: boolean
  analyzingLabel?: string
  /** icon：角标；bubble：旁侧气泡文案（窄栏更合适） */
  placement?: 'icon' | 'bubble'
}) {
  if (analyzing) {
    if (placement === 'bubble') {
      return (
        <span
          className="pointer-events-none absolute right-full top-1/2 z-10 mr-1.5 -translate-y-1/2 whitespace-nowrap rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium leading-none text-amber-800 shadow-sm"
          title={analyzingLabel}
        >
          {analyzingLabel}
        </span>
      )
    }
    return (
      <span
        className="absolute -right-1.5 -top-1.5 z-10 inline-flex max-w-[4.5rem] items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium leading-none text-amber-800 shadow-sm"
        title={analyzingLabel}
      >
        <Loader2 size={9} className="shrink-0 animate-spin" strokeWidth={2} />
        <span className="truncate">{analyzingLabel}</span>
      </span>
    )
  }

  if (count <= 0) return null
  return (
    <span className="absolute -right-1 -top-1 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium leading-none text-white shadow-sm">
      {count > 9 ? '9+' : count}
    </span>
  )
}
