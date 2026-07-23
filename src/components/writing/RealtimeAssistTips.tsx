import { FileCheck, Loader2, Sparkles } from 'lucide-react'
import { useT } from '../../i18n'
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

interface RealtimeAssistTipsProps {
  enabled: boolean
  batches: RealtimeAssistTipBatch[]
  status: RealtimeAssistStatus
  errorMessage: string | null
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

function TipCard({
  tip,
  typeLabel,
}: {
  tip: RealtimeAssistTip
  typeLabel: (type: string) => string
}) {
  return (
    <li className="rounded-lg border border-neutral-200 bg-white px-2.5 py-2">
      <div className="flex items-center gap-1.5">
        <Sparkles size={12} className="shrink-0 text-neutral-400" strokeWidth={1.75} />
        <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
          {typeLabel(tip.type)}
        </span>
      </div>
      {tip.original ? (
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500 line-through decoration-neutral-300">
          {tip.original}
        </p>
      ) : null}
      {tip.suggestion ? (
        <p className="mt-0.5 text-xs leading-relaxed text-neutral-800">{tip.suggestion}</p>
      ) : null}
      {tip.note ? (
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{tip.note}</p>
      ) : null}
    </li>
  )
}

export function RealtimeAssistTips({
  enabled,
  batches,
  status,
  errorMessage,
  compact = false,
}: RealtimeAssistTipsProps) {
  const t = useT()

  if (!enabled) return null

  const typeLabel = (type: string) => {
    if (type === 'grammar' || type === 'wording' || type === 'polish') {
      return t(TYPE_LABEL_KEY[type])
    }
    return type
  }

  const hasBatches = batches.length > 0

  return (
    <section
      className={`rounded-xl border border-neutral-200 bg-neutral-50 ${compact ? 'p-3' : 'p-3.5'}`}
    >
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
      </div>

      <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500">
        {t('assist.realtime.hint')}
      </p>

      {status === 'error' && errorMessage && (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-800">
          {errorMessage}
        </p>
      )}

      {!hasBatches && status === 'ready' && (
        <p className="mt-2 text-[11px] text-neutral-400">{t('assist.realtime.empty')}</p>
      )}

      {!hasBatches && (status === 'idle' || status === 'waiting' || status === 'loading') && (
        <p className="mt-2 text-[11px] text-neutral-400">{t('assist.realtime.idle')}</p>
      )}

      {hasBatches && (
        <div className="mt-2.5 space-y-3">
          {batches.map((batch) => (
            <div key={batch.id}>
              <p className="mb-1.5 text-[10px] font-medium tracking-wide text-neutral-400">
                {t('assist.realtime.roundAt', { time: formatBatchTime(batch.createdAt) })}
              </p>
              <ul className="space-y-2">
                {batch.tips.map((tip, index) => (
                  <TipCard
                    key={`${batch.id}-${tip.type}-${tip.original}-${index}`}
                    tip={tip}
                    typeLabel={typeLabel}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export function RealtimeAssistBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-medium leading-none text-white">
      {count > 9 ? '9+' : count}
    </span>
  )
}
