import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, LayoutGrid, X } from 'lucide-react'
import { ASSIST_FEATURES, getAssistFeature, type AssistFeatureId } from './assistConfig'
import { formatSecondsForRail, WritingTimerAssist } from './WritingTimerAssist'
import { WritingAiAssist } from './WritingAiAssist'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  )

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const onChange = () => setIsDesktop(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return isDesktop
}

interface AssistPanelContentProps {
  activeFeature: AssistFeatureId | null
  onActiveFeatureChange: (id: AssistFeatureId | null) => void
  timerRunning: boolean
  timerDisplaySeconds: number
  panelOpen: boolean
  headerClose: ReactNode
  onTimerRunningChange: (running: boolean, displaySeconds: number) => void
}

function AssistPanelContent({
  activeFeature,
  onActiveFeatureChange,
  timerRunning,
  timerDisplaySeconds,
  panelOpen,
  headerClose,
  onTimerRunningChange,
}: AssistPanelContentProps) {
  const activeFeatureMeta = activeFeature ? getAssistFeature(activeFeature) : null
  const showTimerDetail = panelOpen && activeFeature === 'writing-timer'
  const showAiDetail = panelOpen && activeFeature === 'ai-assistant'

  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-neutral-200 px-3">
        {activeFeature ? (
          <button
            type="button"
            onClick={() => onActiveFeatureChange(null)}
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
        {headerClose}
      </div>

      {panelOpen && !activeFeature && (
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
                  onClick={() => onActiveFeatureChange(feature.id)}
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
        <WritingTimerAssist onRunningChange={onTimerRunningChange} />
      </div>
    </>
  )
}

export function WritingAssistPanel() {
  const isDesktop = useIsDesktop()
  const [desktopExpanded, setDesktopExpanded] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeFeature, setActiveFeature] = useState<AssistFeatureId | null>(null)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerDisplaySeconds, setTimerDisplaySeconds] = useState(0)

  const handleTimerRunningChange = useCallback((running: boolean, displaySeconds: number) => {
    setTimerRunning(running)
    setTimerDisplaySeconds(displaySeconds)
  }, [])

  const panelOpen = isDesktop ? desktopExpanded : mobileOpen
  const activeFeatureMeta = activeFeature ? getAssistFeature(activeFeature) : null
  const showTimerDetail = panelOpen && activeFeature === 'writing-timer'
  const showAiDetail = panelOpen && activeFeature === 'ai-assistant'

  const closeMobile = () => {
    setMobileOpen(false)
    setActiveFeature(null)
  }

  const closeDesktop = () => {
    setDesktopExpanded(false)
    setActiveFeature(null)
  }

  const mobileContentProps = {
    activeFeature,
    onActiveFeatureChange: setActiveFeature,
    timerRunning,
    timerDisplaySeconds,
    panelOpen: mobileOpen,
    onTimerRunningChange: handleTimerRunningChange,
  }

  return (
    <>
      <aside
        className={`hidden shrink-0 flex-col overflow-hidden border-l border-neutral-200 bg-white transition-[width] duration-300 ease-out lg:flex ${
          desktopExpanded ? 'w-80' : 'w-11'
        }`}
      >
        {desktopExpanded && (
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
              onClick={closeDesktop}
              className="shrink-0 rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
              aria-label="收起辅助面板"
              title="收起"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {desktopExpanded && !activeFeature && (
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

        <div className={showAiDetail && isDesktop ? 'flex-1 overflow-y-auto p-4' : 'hidden'}>
          {isDesktop && <WritingAiAssist />}
        </div>

        {isDesktop && (
          <div className={showTimerDetail ? 'flex-1 overflow-y-auto p-4' : 'hidden'}>
            <WritingTimerAssist onRunningChange={handleTimerRunningChange} />
          </div>
        )}

        {!desktopExpanded && (
          <button
            type="button"
            onClick={() => setDesktopExpanded(true)}
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
            <span className="text-[11px] font-medium tracking-wide text-neutral-500 [writing-mode:vertical-rl]">
              写作辅助
            </span>
          </button>
        )}
      </aside>

      {!isDesktop && (
        <>
          {!mobileOpen && (
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] right-4 z-30 flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-md transition-colors hover:bg-neutral-50"
              aria-label="打开写作辅助"
            >
              <LayoutGrid size={18} strokeWidth={1.75} />
              辅助
              {timerRunning && (
                <span className="font-mono text-xs text-amber-600">
                  {formatSecondsForRail(timerDisplaySeconds)}
                </span>
              )}
            </button>
          )}

          <div className={mobileOpen ? 'fixed inset-0 z-50' : 'hidden'}>
            {mobileOpen && (
              <button
                type="button"
                className="absolute inset-0 bg-black/40"
                onClick={closeMobile}
                aria-label="关闭写作辅助"
              />
            )}
            <div className="absolute inset-x-0 bottom-0 top-10 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-neutral-200 bg-white shadow-xl">
              <AssistPanelContent
                {...mobileContentProps}
                headerClose={
                  <button
                    type="button"
                    onClick={closeMobile}
                    className="shrink-0 rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                    aria-label="关闭"
                  >
                    <X size={18} />
                  </button>
                }
              />
            </div>
          </div>
        </>
      )}
    </>
  )
}
