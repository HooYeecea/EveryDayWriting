import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  GripHorizontal,
  LayoutGrid,
  Lightbulb,
  Timer,
  Wand2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { ASSIST_FEATURES, getAssistFeature, type AssistFeatureId } from './assistConfig'
import { formatSecondsForRail, WritingTimerAssist } from './WritingTimerAssist'
import { WritingAiAssist } from './WritingAiAssist'
import {
  loadAiAssistSettings,
  type AiAssistSettings,
} from '../../storage/aiSettingsStorage'

/** PC 折叠窄条上展示的已开启功能指示 */
const AI_RAIL_INDICATORS: {
  key: keyof Pick<
    AiAssistSettings,
    'postSubmitReview' | 'postSubmitStructure' | 'postSubmitSuggestions' | 'realtimeAssist'
  >
  label: string
  icon: LucideIcon
}[] = [
  { key: 'postSubmitReview', label: 'AI 检查与修改', icon: Wand2 },
  { key: 'postSubmitStructure', label: '结构与评分', icon: BarChart3 },
  { key: 'postSubmitSuggestions', label: '提升建议', icon: Lightbulb },
  { key: 'realtimeAssist', label: '实时辅助写作', icon: FileCheck },
]

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

const MOBILE_PANEL_WIDTH = 352
const MOBILE_PANEL_MAX_HEIGHT = 480
const MOBILE_BOTTOM_RESERVE = 68
const MOBILE_FAB_STORAGE_KEY = 'ew-mobile-assist-fab-position'
const DRAG_THRESHOLD = 8

type FloatingPosition = { x: number; y: number }

function clampFloatingPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  bottomReserve = MOBILE_BOTTOM_RESERVE,
) {
  const pad = 8
  const maxX = window.innerWidth - width - pad
  const maxY = window.innerHeight - height - pad - bottomReserve

  return {
    x: Math.min(Math.max(pad, x), Math.max(pad, maxX)),
    y: Math.min(Math.max(pad, y), Math.max(pad, maxY)),
  }
}

function loadStoredFabPosition(): FloatingPosition | null {
  try {
    const raw = sessionStorage.getItem(MOBILE_FAB_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FloatingPosition
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
      return parsed
    }
  } catch {
    // ignore invalid storage
  }
  return null
}

function getDefaultFabPosition() {
  const width = 92
  const height = 40

  return clampFloatingPosition(
    window.innerWidth - width - 16,
    window.innerHeight - MOBILE_BOTTOM_RESERVE - 56 - height,
    width,
    height,
  )
}

function getDefaultMobilePanelPosition() {
  const width = Math.min(window.innerWidth - 32, MOBILE_PANEL_WIDTH)
  const height = Math.min(window.innerHeight * 0.65, MOBILE_PANEL_MAX_HEIGHT)

  return clampFloatingPosition(
    window.innerWidth - width - 16,
    window.innerHeight - height - MOBILE_BOTTOM_RESERVE - 16,
    width,
    height,
  )
}

function getMobilePanelPositionNearFab(fabRect: DOMRect) {
  const width = Math.min(window.innerWidth - 32, MOBILE_PANEL_WIDTH)
  const height = Math.min(window.innerHeight * 0.65, MOBILE_PANEL_MAX_HEIGHT)

  return clampFloatingPosition(
    fabRect.left + fabRect.width / 2 - width / 2,
    fabRect.top - height - 12,
    width,
    height,
  )
}

interface MobileDraggableAssistFabProps {
  position: FloatingPosition
  onPositionChange: (position: FloatingPosition) => void
  onOpen: () => void
  timerRunning: boolean
  timerPaused: boolean
  timerDisplaySeconds: number
  fabRef: RefObject<HTMLButtonElement | null>
}

function MobileDraggableAssistFab({
  position,
  onPositionChange,
  onOpen,
  timerRunning,
  timerPaused,
  timerDisplaySeconds,
  fabRef,
}: MobileDraggableAssistFabProps) {
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
    moved: boolean
  } | null>(null)

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const deltaX = event.clientX - drag.startX
    const deltaY = event.clientY - drag.startY
    if (!drag.moved && Math.hypot(deltaX, deltaY) >= DRAG_THRESHOLD) {
      drag.moved = true
    }
    if (!drag.moved) return

    const rect = fabRef.current?.getBoundingClientRect()
    const width = rect?.width ?? 92
    const height = rect?.height ?? 40
    onPositionChange(
      clampFloatingPosition(drag.originX + deltaX, drag.originY + deltaY, width, height),
    )
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const moved = drag.moved
    dragRef.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)

    if (!moved) {
      onOpen()
      return
    }

    const rect = fabRef.current?.getBoundingClientRect()
    const width = rect?.width ?? 92
    const height = rect?.height ?? 40
    const next = clampFloatingPosition(
      drag.originX + event.clientX - drag.startX,
      drag.originY + event.clientY - drag.startY,
      width,
      height,
    )
    onPositionChange(next)
    sessionStorage.setItem(MOBILE_FAB_STORAGE_KEY, JSON.stringify(next))
  }

  useEffect(() => {
    const keepInView = () => {
      const rect = fabRef.current?.getBoundingClientRect()
      if (!rect) return
      onPositionChange(clampFloatingPosition(position.x, position.y, rect.width, rect.height))
    }

    window.addEventListener('resize', keepInView)
    return () => window.removeEventListener('resize', keepInView)
  }, [fabRef, onPositionChange, position.x, position.y])

  return (
    <button
      ref={fabRef}
      type="button"
      style={{ left: position.x, top: position.y }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`fixed z-40 flex cursor-grab touch-none items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-md transition-transform duration-200 active:scale-95 active:cursor-grabbing ${timerRunning && !timerPaused ? 'animate-pulse-soft' : ''}`}
      aria-label="打开写作辅助，按住可拖动"
      title="点击打开，按住拖动"
    >
      <LayoutGrid size={18} strokeWidth={1.75} />
      辅助
      {timerRunning && (
        <span className="font-mono text-xs text-amber-600">
          {timerPaused ? '暂停 ' : ''}
          {formatSecondsForRail(timerDisplaySeconds)}
        </span>
      )}
    </button>
  )
}

interface MobileFloatingAssistPanelProps {
  open: boolean
  position: { x: number; y: number }
  onPositionChange: (position: { x: number; y: number }) => void
  children: ReactNode
}

function MobileFloatingAssistPanel({
  open,
  position,
  onPositionChange,
  children,
}: MobileFloatingAssistPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  )

  const handleDragPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleDragPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const rect = panelRef.current?.getBoundingClientRect()
    const width = rect?.width ?? MOBILE_PANEL_WIDTH
    const height = rect?.height ?? MOBILE_PANEL_MAX_HEIGHT
    const next = clampFloatingPosition(
      drag.originX + event.clientX - drag.startX,
      drag.originY + event.clientY - drag.startY,
      width,
      height,
    )
    onPositionChange(next)
  }

  const handleDragPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  useEffect(() => {
    if (!open) return

    const keepInView = () => {
      const rect = panelRef.current?.getBoundingClientRect()
      if (!rect) return
      onPositionChange(clampFloatingPosition(position.x, position.y, rect.width, rect.height))
    }

    window.addEventListener('resize', keepInView)
    return () => window.removeEventListener('resize', keepInView)
  }, [open, onPositionChange, position.x, position.y])

  return (
    <div className={open ? 'fixed inset-0 z-50 pointer-events-none' : 'hidden'}>
      <div
        ref={panelRef}
        style={{ left: position.x, top: position.y }}
        className="pointer-events-auto absolute flex w-[min(calc(100vw-2rem),22rem)] max-h-[min(70dvh,30rem)] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl"
      >
        <div
          className="flex h-10 shrink-0 cursor-grab items-center justify-center border-b border-neutral-100 bg-neutral-50/80 touch-none active:cursor-grabbing"
          onPointerDown={handleDragPointerDown}
          onPointerMove={handleDragPointerMove}
          onPointerUp={handleDragPointerUp}
          onPointerCancel={handleDragPointerUp}
          aria-label="拖动辅助面板"
          title="按住拖动"
        >
          <GripHorizontal size={18} className="text-neutral-400" strokeWidth={1.75} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  )
}

interface AssistPanelContentProps {
  activeFeature: AssistFeatureId | null
  onActiveFeatureChange: (id: AssistFeatureId | null) => void
  timerRunning: boolean
  timerPaused: boolean
  timerDisplaySeconds: number
  panelOpen: boolean
  headerClose: ReactNode
  onTimerRunningChange: (running: boolean, displaySeconds: number, paused: boolean) => void
  onAiSettingsSaved?: (settings: AiAssistSettings) => void
}

function AssistPanelContent({
  activeFeature,
  onActiveFeatureChange,
  timerRunning,
  timerPaused,
  timerDisplaySeconds,
  panelOpen,
  headerClose,
  onTimerRunningChange,
  onAiSettingsSaved,
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
                        {timerPaused ? '已暂停' : '计时中'} {formatSecondsForRail(timerDisplaySeconds)}
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
        <WritingAiAssist onSettingsSaved={onAiSettingsSaved} />
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
  const [timerPaused, setTimerPaused] = useState(false)
  const [timerDisplaySeconds, setTimerDisplaySeconds] = useState(0)
  const [aiSettings, setAiSettings] = useState(loadAiAssistSettings)
  const [mobilePosition, setMobilePosition] = useState(getDefaultMobilePanelPosition)
  const [fabPosition, setFabPosition] = useState(
    () => loadStoredFabPosition() ?? getDefaultFabPosition(),
  )
  const mobileFabRef = useRef<HTMLButtonElement>(null)

  const handleTimerRunningChange = useCallback(
    (running: boolean, displaySeconds: number, paused: boolean) => {
      setTimerRunning(running)
      setTimerPaused(paused)
      setTimerDisplaySeconds(displaySeconds)
    },
    [],
  )

  const handleAiSettingsSaved = useCallback((settings: AiAssistSettings) => {
    setAiSettings(settings)
  }, [])

  const openDesktopFeature = useCallback((id: AssistFeatureId) => {
    setDesktopExpanded(true)
    setActiveFeature(id)
  }, [])

  const panelOpen = isDesktop ? desktopExpanded : mobileOpen
  const activeFeatureMeta = activeFeature ? getAssistFeature(activeFeature) : null
  const showTimerDetail = panelOpen && activeFeature === 'writing-timer'
  const showAiDetail = panelOpen && activeFeature === 'ai-assistant'
  const enabledAiRailIndicators = AI_RAIL_INDICATORS.filter((item) => aiSettings[item.key])

  const openMobile = () => {
    const fabRect = mobileFabRef.current?.getBoundingClientRect()
    setMobilePosition(fabRect ? getMobilePanelPositionNearFab(fabRect) : getDefaultMobilePanelPosition())
    setMobileOpen(true)
  }

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
    timerPaused,
    timerDisplaySeconds,
    panelOpen: mobileOpen,
    onTimerRunningChange: handleTimerRunningChange,
    onAiSettingsSaved: handleAiSettingsSaved,
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
                          {timerPaused ? '已暂停' : '计时中'}{' '}
                          {formatSecondsForRail(timerDisplaySeconds)}
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
          {isDesktop && <WritingAiAssist onSettingsSaved={handleAiSettingsSaved} />}
        </div>

        {isDesktop && (
          <div className={showTimerDetail ? 'flex-1 overflow-y-auto p-4' : 'hidden'}>
            <WritingTimerAssist onRunningChange={handleTimerRunningChange} />
          </div>
        )}

        {!desktopExpanded && (
          <div className="flex h-full w-full flex-col items-center">
            <button
              type="button"
              onClick={() => setDesktopExpanded(true)}
              className="flex w-full flex-col items-center gap-3 py-4 text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-600"
              aria-label="展开写作辅助"
              title="写作辅助"
            >
              <ChevronLeft size={18} />
              <LayoutGrid size={18} strokeWidth={1.75} />
              <span className="text-[11px] font-medium tracking-wide text-neutral-500 [writing-mode:vertical-rl]">
                写作辅助
              </span>
            </button>

            {(enabledAiRailIndicators.length > 0 || timerRunning) && (
              <div className="flex flex-col items-center gap-2.5 px-1 pb-4">
                {enabledAiRailIndicators.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => openDesktopFeature('ai-assistant')}
                    className="rounded-md p-1.5 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                    aria-label={`打开${label}`}
                    title={label}
                  >
                    <Icon size={15} strokeWidth={1.75} />
                  </button>
                ))}
                {timerRunning && (
                  <button
                    type="button"
                    onClick={() => openDesktopFeature('writing-timer')}
                    className={`flex flex-col items-center gap-0.5 rounded-md p-1.5 text-amber-700 transition-colors hover:bg-amber-50 ${
                      timerPaused ? '' : 'animate-pulse-soft'
                    }`}
                    aria-label="打开写作计时"
                    title={timerPaused ? '计时已暂停' : '计时中'}
                  >
                    <Timer size={15} strokeWidth={1.75} />
                    <span className="font-mono text-[9px] font-medium leading-none">
                      {formatSecondsForRail(timerDisplaySeconds)}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </aside>

      {!isDesktop && (
        <>
          {!mobileOpen && (
            <MobileDraggableAssistFab
              fabRef={mobileFabRef}
              position={fabPosition}
              onPositionChange={setFabPosition}
              onOpen={openMobile}
              timerRunning={timerRunning}
              timerPaused={timerPaused}
              timerDisplaySeconds={timerDisplaySeconds}
            />
          )}

          <MobileFloatingAssistPanel
            open={mobileOpen}
            position={mobilePosition}
            onPositionChange={setMobilePosition}
          >
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
          </MobileFloatingAssistPanel>
        </>
      )}
    </>
  )
}
