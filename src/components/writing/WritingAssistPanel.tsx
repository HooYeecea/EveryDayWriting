import { useCallback, useState } from 'react'
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react'
import { ASSIST_FEATURES, getAssistFeature, type AssistFeatureId } from './assistConfig'
import { formatSecondsForRail, WritingTimerAssist } from './WritingTimerAssist'
import { WritingAiAssist } from './WritingAiAssist'

export function WritingAssistPanel() {
  const [expanded, setExpanded] = useState(false)
  const [activeFeature, setActiveFeature] = useState<AssistFeatureId | null>(null)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerDisplaySeconds, setTimerDisplaySeconds] = useState(0)

  const handleTimerRunningChange = useCallback((running: boolean, displaySeconds: number) => {
    setTimerRunning(running)
    setTimerDisplaySeconds(displaySeconds)
  }, [])

  const handleCollapse = () => {
    setExpanded(false)
    setActiveFeature(null)
  }

  const activeFeatureMeta = activeFeature ? getAssistFeature(activeFeature) : null
  const showTimerDetail = expanded && activeFeature === 'writing-timer'
  const showAiDetail = expanded && activeFeature === 'ai-assistant'

  return (
    <aside
      className={`hidden shrink-0 flex-col overflow-hidden border-l border-neutral-200 bg-white transition-[width] duration-300 ease-out lg:flex ${
        expanded ? 'w-80' : 'w-11'
      }`}
    >
      {expanded && (
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-neutral-200 px-3">
          {activeFeature ? (
            <button
              type="button"
              onClick={() => setActiveFeature(null)}
              className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
              aria-label="返回辅助功能列表"
              title="返回"
            >
              <ChevronLeft size={18} />
            </button>
          ) : (
            <LayoutGrid size={18} className="ml-1 shrink-0 text-neutral-400" />
          )}
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-900">
            {activeFeatureMeta?.label ?? '写作辅助'}
          </h3>
          <button
            type="button"
            onClick={handleCollapse}
            className="shrink-0 rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
            aria-label="收起辅助面板"
            title="收起"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {expanded && !activeFeature && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            <p className="mb-3 text-xs text-neutral-500">选择一项辅助功能</p>
            {ASSIST_FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <button
                  key={feature.id}
                  type="button"
                  disabled={!feature.available}
                  onClick={() => setActiveFeature(feature.id)}
                  className="flex w-full items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-left transition-colors hover:border-neutral-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white">
                    <Icon size={18} className="text-neutral-500" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900">{feature.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
                      {feature.description}
                    </p>
                    {feature.id === 'writing-timer' && timerRunning && (
                      <p className="mt-1 font-mono text-[11px] text-amber-600">
                        计时中 {formatSecondsForRail(timerDisplaySeconds)}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={16} className="mt-0.5 shrink-0 text-neutral-300" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className={showAiDetail ? 'flex-1 overflow-y-auto p-4' : 'hidden'}>
        <WritingAiAssist />
      </div>

      <div className={showTimerDetail ? 'flex-1 overflow-y-auto p-4' : 'hidden'}>
        <WritingTimerAssist onRunningChange={handleTimerRunningChange} />
      </div>

      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex h-full w-full flex-col items-center gap-3 py-4 text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-600"
          aria-label="展开写作辅助"
          title="写作辅助"
        >
          <ChevronLeft size={18} />
          <LayoutGrid size={18} strokeWidth={1.75} />
          {timerRunning && (
            <span className="font-mono text-[10px] font-medium text-neutral-600">
              {formatSecondsForRail(timerDisplaySeconds)}
            </span>
          )}
          <span
            className="text-[11px] font-medium tracking-wide text-neutral-500"
            style={{ writingMode: 'vertical-rl' }}
          >
            写作辅助
          </span>
        </button>
      )}
    </aside>
  )
}
