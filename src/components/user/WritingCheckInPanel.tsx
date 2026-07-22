import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { getCheckInCalendar, getCheckInStatus, getCheckInYearCalendar } from '../../api/checkIn'
import { usePreferences } from '../../context/PreferencesContext'
import { useT } from '../../i18n'
import type { MessageKey } from '../../i18n'
import type { CheckInCalendar, CheckInStatus } from '../../types'
import { APP_LOCALE_TO_BCP47, type DateFormatPref, type WeekStartsOn } from '../../types/preferences'
import {
  addDays,
  buildCalendarRequestKey,
  buildCheckedDaySet,
  buildMonthGrid,
  buildMonthMiniGrid,
  createEmptyYearCalendars,
  formatMonthLabel,
  formatWeekLabel,
  formatYearLabel,
  getDaysInMonth,
  getMonthKeysFromDates,
  getWeekAnchorDate,
  getWeekDays,
  getWeekdayLabels,
  measureElementHeight,
  resolveTargetViewHeight,
  startOfWeek,
  toDateKey,
  type CalendarViewMode,
} from '../../utils/checkInCalendar'

function calendarCacheKey(year: number, month: number): string {
  return `${year}-${month}`
}

const CALENDAR_VIEW_KEYS: Record<CalendarViewMode, MessageKey> = {
  year: 'checkin.view.year',
  month: 'checkin.view.month',
  week: 'checkin.view.week',
}

function CalendarViewToggle({
  value,
  onChange,
  label,
  ariaLabel,
}: {
  value: CalendarViewMode
  onChange: (mode: CalendarViewMode) => void
  label: (mode: CalendarViewMode) => string
  ariaLabel: string
}) {
  const modes = Object.keys(CALENDAR_VIEW_KEYS) as CalendarViewMode[]
  const activeIndex = modes.indexOf(value)

  return (
    <div
      className="relative flex w-full rounded-lg border border-neutral-200 bg-neutral-50 p-0.5 sm:w-auto"
      role="tablist"
      aria-label={ariaLabel}
    >
      <span
        aria-hidden
        className="absolute bottom-0.5 top-0.5 rounded-md bg-white shadow-sm transition-transform duration-300 ease-out"
        style={{
          width: `calc((100% - 0.25rem) / ${modes.length})`,
          transform: `translateX(calc(${activeIndex} * 100%))`,
        }}
      />
      {modes.map((mode) => (
        <button
          key={mode}
          type="button"
          role="tab"
          aria-selected={value === mode}
          onClick={() => onChange(mode)}
          className={`relative z-10 flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-200 sm:min-w-[3rem] sm:px-4 sm:text-sm ${
            value === mode ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          {label(mode)}
        </button>
      ))}
    </div>
  )
}

function DayCell({
  day,
  checked,
  isToday,
  muted = false,
  size = 'md',
}: {
  day: number
  checked: boolean
  isToday: boolean
  muted?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  if (day <= 0) {
    return <div className={size === 'sm' ? 'aspect-square' : 'aspect-square min-h-0'} />
  }

  const sizeClass =
    size === 'sm'
      ? 'aspect-square rounded-[4px] text-[9px] sm:text-[10px]'
      : size === 'lg'
        ? 'min-h-[4.5rem] rounded-xl text-sm sm:min-h-[5.5rem] sm:text-base'
        : 'aspect-square rounded-lg text-xs'

  return (
    <div
      className={`flex items-center justify-center ${sizeClass} ${
        muted
          ? 'text-neutral-300'
          : checked
            ? 'bg-neutral-900 font-medium text-white'
            : isToday
              ? 'border border-neutral-300 bg-white font-medium text-neutral-900'
              : 'bg-neutral-50 text-neutral-600'
      }`}
    >
      {day}
    </div>
  )
}

function YearCalendarView({
  viewYear,
  yearCalendars,
  checkedDaySet,
  today,
  todayKey,
  weekStartsOn,
  dateLocale,
  onOpenMonth,
}: {
  viewYear: number
  yearCalendars: CheckInCalendar[]
  checkedDaySet: Set<string>
  today: Date
  todayKey: string
  weekStartsOn: WeekStartsOn
  dateLocale: string
  onOpenMonth: (monthIndex: number) => void
}) {
  const months = yearCalendars.length === 12 ? yearCalendars : createEmptyYearCalendars(viewYear)

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
      {months.map((monthCalendar, monthIndex) => {
        const daysInMonth = getDaysInMonth(viewYear, monthIndex)
        const miniCells = buildMonthMiniGrid(viewYear, monthIndex, weekStartsOn)
        const isCurrentMonth = viewYear === today.getFullYear() && monthIndex === today.getMonth()

        return (
          <button
            key={`${viewYear}-${monthIndex + 1}`}
            type="button"
            onClick={() => onOpenMonth(monthIndex)}
            className={`rounded-xl border p-2 text-left transition-colors duration-200 hover:border-neutral-300 hover:bg-neutral-50 sm:p-3 ${
              isCurrentMonth ? 'border-neutral-300 bg-neutral-50/80' : 'border-neutral-100'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-medium text-neutral-800 sm:text-sm">
                {new Date(viewYear, monthIndex, 1).toLocaleDateString(dateLocale, {
                  month: 'short',
                })}
              </span>
              <span className="text-[10px] text-neutral-400 sm:text-xs">
                {monthCalendar.totalDays}/{daysInMonth}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-7 gap-0.5">
              {miniCells.map((cell) => (
                <DayCell
                  key={cell.key}
                  day={cell.inMonth ? cell.day : 0}
                  checked={cell.inMonth ? checkedDaySet.has(cell.key) : false}
                  isToday={cell.key === todayKey}
                  size="sm"
                />
              ))}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function MonthCalendarView({
  calendarCells,
  checkedDaySet,
  todayKey,
  weekdayLabels,
}: {
  calendarCells: ReturnType<typeof buildMonthGrid>
  checkedDaySet: Set<string>
  todayKey: string
  weekdayLabels: string[]
}) {
  return (
    <>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-neutral-400 sm:text-xs">
        {weekdayLabels.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarCells.map((cell) => (
          <DayCell
            key={cell.key}
            day={cell.day}
            checked={checkedDaySet.has(cell.key)}
            isToday={cell.key === todayKey}
            muted={!cell.inMonth}
          />
        ))}
      </div>
    </>
  )
}

function WeekCalendarView({
  weekDays,
  checkedDaySet,
  todayKey,
  weekdayLabels,
  dateLocale,
  dateFormat,
}: {
  weekDays: Date[]
  checkedDaySet: Set<string>
  todayKey: string
  weekdayLabels: string[]
  dateLocale: string
  dateFormat: DateFormatPref
}) {
  return (
    <>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-neutral-400 sm:text-xs">
        {weekdayLabels.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekDays.map((date) => {
          const key = toDateKey(date)
          const dayLabel =
            dateFormat === 'ymd'
              ? `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
              : date.toLocaleDateString(dateFormat === 'mdy' ? 'en-US' : dateLocale, {
                  month: 'numeric',
                  day: 'numeric',
                })
          return (
            <div key={key} className="flex flex-col items-center gap-1">
              <DayCell
                day={date.getDate()}
                checked={checkedDaySet.has(key)}
                isToday={key === todayKey}
                size="lg"
              />
              <span className="hidden text-[10px] text-neutral-400 sm:block">{dayLabel}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}

type SlideDirection = 'prev' | 'next'

const VIEW_MODE_HEIGHT_DURATION_MS = 900

function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3
}

function slideEnterClass(direction: SlideDirection | null): string {
  if (direction === 'next') return 'checkin-slide-enter-next'
  if (direction === 'prev') return 'checkin-slide-enter-prev'
  return ''
}

export function WritingCheckInPanel({ onReady }: { onReady?: () => void } = {}) {
  const t = useT()
  const { preferences } = usePreferences()
  const weekStartsOn = preferences.ui.weekStartsOn
  const dateFormat = preferences.ui.dateFormat
  const dateLocale = APP_LOCALE_TO_BCP47[preferences.locale]
  const weekdayLabels = useMemo(
    () => getWeekdayLabels(weekStartsOn, dateLocale),
    [dateLocale, weekStartsOn],
  )

  const today = useMemo(() => new Date(), [])
  const todayKey = useMemo(() => toDateKey(today), [today])
  const calendarCache = useRef(new Map<string, CheckInCalendar>())
  const calendarRequestSeq = useRef(0)
  const readyReportedRef = useRef(false)
  const shellRef = useRef<HTMLDivElement>(null)
  const yearInnerRef = useRef<HTMLDivElement>(null)
  const monthInnerRef = useRef<HTMLDivElement>(null)
  const weekInnerRef = useRef<HTMLDivElement>(null)
  const heightCacheRef = useRef<Record<CalendarViewMode, number>>({
    year: 520,
    month: 300,
    week: 132,
  })
  const prevViewModeRef = useRef<CalendarViewMode>('month')
  const heightAnimFrameRef = useRef(0)
  const heightTransitionLockUntilRef = useRef(0)
  const isHeightAnimatingRef = useRef(false)
  const shellHeightRef = useRef(300)
  const scrollLockRef = useRef<{ parent: HTMLElement; top: number } | null>(null)

  const [shellHeight, setShellHeightState] = useState(300)

  const setShellHeight = useCallback((height: number) => {
    shellHeightRef.current = height
    setShellHeightState(height)
  }, [])
  const [slideDirection, setSlideDirection] = useState<SlideDirection | null>(null)

  const [status, setStatus] = useState<CheckInStatus | null>(null)
  const [calendar, setCalendar] = useState<CheckInCalendar | null>(null)
  const [yearCalendars, setYearCalendars] = useState<CheckInCalendar[]>(() =>
    createEmptyYearCalendars(today.getFullYear()),
  )
  const [weekCalendars, setWeekCalendars] = useState<CheckInCalendar[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)

  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewWeekStart, setViewWeekStart] = useState(() => startOfWeek(today, weekStartsOn))

  useEffect(() => {
    setViewWeekStart((prev) => startOfWeek(addDays(prev, 3), weekStartsOn))
  }, [weekStartsOn])

  const requestKey = useMemo(
    () => buildCalendarRequestKey(viewMode, viewYear, viewMonth, viewWeekStart),
    [viewMode, viewMonth, viewWeekStart, viewYear],
  )

  const isSynced = loadedKey === requestKey

  const cacheMonth = useCallback((data: CheckInCalendar) => {
    calendarCache.current.set(calendarCacheKey(data.year, data.month), data)
  }, [])

  const getCachedMonth = useCallback((year: number, month: number) => {
    return calendarCache.current.get(calendarCacheKey(year, month)) ?? null
  }, [])

  const getCachedYearCalendars = useCallback(
    (year: number): CheckInCalendar[] | null => {
      const calendars = Array.from({ length: 12 }, (_, index) => getCachedMonth(year, index + 1))
      return calendars.every((item): item is CheckInCalendar => item !== null) ? calendars : null
    },
    [getCachedMonth],
  )

  useLayoutEffect(() => {
    if (loadedKey === requestKey) return

    if (viewMode === 'year') {
      setYearCalendars(getCachedYearCalendars(viewYear) ?? createEmptyYearCalendars(viewYear))
      return
    }

    if (viewMode === 'month') {
      const cachedMonth = getCachedMonth(viewYear, viewMonth + 1)
      if (cachedMonth) {
        setCalendar(cachedMonth)
      }
      return
    }

    const days = getWeekDays(viewWeekStart)
    const monthKeys = getMonthKeysFromDates(days)
    const cachedWeek = monthKeys
      .map(({ year, month }) => getCachedMonth(year, month))
      .filter((item): item is CheckInCalendar => item !== null)
    if (cachedWeek.length === monthKeys.length) {
      setWeekCalendars(cachedWeek)
    }
  }, [getCachedMonth, getCachedYearCalendars, loadedKey, requestKey, viewMode, viewMonth, viewWeekStart, viewYear])

  const calendarCells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth, weekStartsOn),
    [viewMonth, viewYear, weekStartsOn],
  )

  const weekDays = useMemo(() => getWeekDays(viewWeekStart), [viewWeekStart])

  const checkedDaySet = useMemo(() => {
    if (viewMode === 'year') {
      if (!isSynced) return new Set<string>()
      return buildCheckedDaySet(yearCalendars)
    }

    if (viewMode === 'week') {
      if (isSynced && weekCalendars.length > 0) {
        return buildCheckedDaySet(weekCalendars)
      }
      const cached = new Set<string>()
      for (const date of weekDays) {
        const monthData = getCachedMonth(date.getFullYear(), date.getMonth() + 1)
        if (monthData?.checkedDays.includes(date.getDate())) {
          cached.add(toDateKey(date))
        }
      }
      return cached
    }

    if (!isSynced) return new Set<string>()
    if (calendar) {
      return buildCheckedDaySet([calendar])
    }
    return new Set<string>()
  }, [calendar, getCachedMonth, isSynced, viewMode, weekCalendars, weekDays, yearCalendars])

  const measureAllLayerHeights = useCallback(() => {
    const heights: Partial<Record<CalendarViewMode, number>> = {
      year: measureElementHeight(yearInnerRef.current),
      month: measureElementHeight(monthInnerRef.current),
      week: measureElementHeight(weekInnerRef.current),
    }

    return heights
  }, [])

  const refreshHeightCache = useCallback(() => {
    const heights = measureAllLayerHeights()
    for (const [key, value] of Object.entries(heights) as Array<[CalendarViewMode, number]>) {
      if (value > 0) {
        heightCacheRef.current[key] = value
      }
    }
    return heights
  }, [measureAllLayerHeights])

  const lockScrollParent = useCallback(() => {
    let node = shellRef.current?.parentElement ?? null
    while (node) {
      const { overflowY } = window.getComputedStyle(node)
      if (overflowY === 'auto' || overflowY === 'scroll') {
        scrollLockRef.current = { parent: node, top: node.scrollTop }
        return
      }
      node = node.parentElement
    }
    scrollLockRef.current = null
  }, [])

  const restoreScrollParent = useCallback(() => {
    const lock = scrollLockRef.current
    if (!lock) return
    lock.parent.scrollTop = lock.top
  }, [])

  const releaseScrollParent = useCallback(() => {
    scrollLockRef.current = null
  }, [])

  const cancelHeightAnimation = useCallback(() => {
    if (heightAnimFrameRef.current) {
      cancelAnimationFrame(heightAnimFrameRef.current)
      heightAnimFrameRef.current = 0
    }
    isHeightAnimatingRef.current = false
    heightTransitionLockUntilRef.current = 0
    releaseScrollParent()
  }, [releaseScrollParent])

  const runHeightAnimation = useCallback(
    (startHeight: number, targetHeight: number) => {
      cancelHeightAnimation()
      isHeightAnimatingRef.current = true
      heightTransitionLockUntilRef.current = Date.now() + VIEW_MODE_HEIGHT_DURATION_MS + 120

      const startTime = performance.now()

      const tick = (now: number) => {
        restoreScrollParent()

        const progress = Math.min((now - startTime) / VIEW_MODE_HEIGHT_DURATION_MS, 1)
        const eased = easeOutCubic(progress)
        setShellHeight(Math.round(startHeight + (targetHeight - startHeight) * eased))

        if (progress < 1) {
          heightAnimFrameRef.current = requestAnimationFrame(tick)
          return
        }

        heightAnimFrameRef.current = 0
        setShellHeight(targetHeight)
        isHeightAnimatingRef.current = false
        heightTransitionLockUntilRef.current = 0
        releaseScrollParent()
      }

      lockScrollParent()
      setShellHeight(startHeight)
      heightAnimFrameRef.current = requestAnimationFrame(tick)
    },
    [cancelHeightAnimation, lockScrollParent, releaseScrollParent, restoreScrollParent, setShellHeight],
  )

  const applyShellHeight = useCallback(
    (mode: CalendarViewMode, heights?: Partial<Record<CalendarViewMode, number>>) => {
      if (isHeightAnimatingRef.current) return
      if (Date.now() < heightTransitionLockUntilRef.current) return

      const measured = heights ?? measureAllLayerHeights()
      for (const [key, value] of Object.entries(measured) as Array<[CalendarViewMode, number]>) {
        if (value > 0) {
          heightCacheRef.current[key] = value
        }
      }
      const nextHeight = measured[mode] ?? heightCacheRef.current[mode]
      if (nextHeight > 0) {
        setShellHeight(nextHeight)
      }
    },
    [measureAllLayerHeights, setShellHeight],
  )

  useLayoutEffect(() => {
    refreshHeightCache()
  }, [calendarCells, refreshHeightCache, viewMonth, viewWeekStart, viewYear, weekDays, yearCalendars])

  useLayoutEffect(() => {
    const previousMode = prevViewModeRef.current
    if (previousMode === viewMode) return

    prevViewModeRef.current = viewMode
    isHeightAnimatingRef.current = true
    heightTransitionLockUntilRef.current = Date.now() + VIEW_MODE_HEIGHT_DURATION_MS + 120

    const startHeight = shellHeightRef.current
    const heights = refreshHeightCache()
    const measuredTarget = heights[viewMode] ?? 0
    const targetHeight = resolveTargetViewHeight(
      viewMode,
      measuredTarget,
      heightCacheRef.current[viewMode],
      startHeight,
    )

    heightCacheRef.current[viewMode] = targetHeight

    if (Math.abs(targetHeight - startHeight) < 2) {
      isHeightAnimatingRef.current = false
      heightTransitionLockUntilRef.current = 0
      setShellHeight(targetHeight)
      return
    }

    runHeightAnimation(startHeight, targetHeight)
  }, [refreshHeightCache, runHeightAnimation, setShellHeight, viewMode])

  useLayoutEffect(() => {
    applyShellHeight(viewMode, measureAllLayerHeights())

    const observers: ResizeObserver[] = []
    for (const ref of [yearInnerRef, monthInnerRef, weekInnerRef]) {
      const node = ref.current
      if (!node) continue

      const observer = new ResizeObserver(() => {
        if (isHeightAnimatingRef.current) return
        applyShellHeight(viewMode, measureAllLayerHeights())
      })
      observer.observe(node)
      observers.push(observer)
    }

    return () => {
      for (const observer of observers) {
        observer.disconnect()
      }
    }
  }, [
    applyShellHeight,
    calendarCells,
    measureAllLayerHeights,
    viewMode,
    viewMonth,
    viewWeekStart,
    viewYear,
    weekDays,
    yearCalendars,
  ])

  useEffect(() => () => cancelHeightAnimation(), [cancelHeightAnimation])

  const periodLabel = useMemo(() => {
    if (viewMode === 'year') return formatYearLabel(viewYear, dateLocale)
    if (viewMode === 'week') return formatWeekLabel(viewWeekStart, dateLocale, dateFormat)
    return formatMonthLabel(viewYear, viewMonth, dateLocale, dateFormat)
  }, [dateFormat, dateLocale, viewMode, viewMonth, viewWeekStart, viewYear])

  useEffect(() => {
    let cancelled = false

    async function loadStatus() {
      try {
        const statusData = await getCheckInStatus()
        if (!cancelled) setStatus(statusData)
      } finally {
        if (!cancelled) setInitialLoading(false)
      }
    }

    void loadStatus()
    return () => {
      cancelled = true
    }
  }, [])

  const loadCalendar = useCallback(async () => {
    const fetchKey = buildCalendarRequestKey(viewMode, viewYear, viewMonth, viewWeekStart)
    const requestSeq = ++calendarRequestSeq.current

    try {
      if (viewMode === 'year') {
        const cachedYear = getCachedYearCalendars(viewYear)
        if (cachedYear) {
          if (requestSeq !== calendarRequestSeq.current) return
          setYearCalendars(cachedYear)
          setLoadedKey(fetchKey)
          return
        }

        const yearData = await getCheckInYearCalendar(viewYear)
        if (requestSeq !== calendarRequestSeq.current) return

        const calendars = yearData.months
        calendars.forEach(cacheMonth)
        setYearCalendars(calendars)
        setLoadedKey(fetchKey)
        return
      }

      if (viewMode === 'week') {
        const days = getWeekDays(viewWeekStart)
        const monthKeys = getMonthKeysFromDates(days)
        const calendars = await Promise.all(
          monthKeys.map(({ year, month }) => getCheckInCalendar(year, month)),
        )
        if (requestSeq !== calendarRequestSeq.current) return

        calendars.forEach(cacheMonth)
        setWeekCalendars(calendars)
        setLoadedKey(fetchKey)
        return
      }

      const calendarData = await getCheckInCalendar(viewYear, viewMonth + 1)
      if (requestSeq !== calendarRequestSeq.current) return

      cacheMonth(calendarData)
      setCalendar(calendarData)
      setLoadedKey(fetchKey)
    } catch {
      // 失败也结束首屏等待，避免 Tab 门禁一直转圈
      if (requestSeq !== calendarRequestSeq.current) return
      setLoadedKey(fetchKey)
    }
  }, [cacheMonth, getCachedYearCalendars, viewMode, viewMonth, viewWeekStart, viewYear])

  useEffect(() => {
    void loadCalendar()
  }, [loadCalendar])

  useEffect(() => {
    if (initialLoading || !isSynced || readyReportedRef.current) return
    readyReportedRef.current = true
    onReady?.()
  }, [initialLoading, isSynced, onReady])

  const switchViewMode = (mode: CalendarViewMode) => {
    if (mode === viewMode) return
    setSlideDirection(null)

    if (mode === 'week') {
      const anchor = getWeekAnchorDate(viewYear, viewMonth, today, viewMode)
      setViewWeekStart(startOfWeek(anchor, weekStartsOn))
    }

    if (mode === 'month' && viewMode === 'week') {
      setViewYear(viewWeekStart.getFullYear())
      setViewMonth(viewWeekStart.getMonth())
    }

    setViewMode(mode)
  }

  const goPrev = () => {
    if (viewMode === 'year') {
      setSlideDirection('prev')
      setViewYear((year) => year - 1)
      return
    }
    if (viewMode === 'week') {
      setViewWeekStart((start) => addDays(start, -7))
      return
    }
    setSlideDirection('prev')
    if (viewMonth === 0) {
      setViewYear((year) => year - 1)
      setViewMonth(11)
      return
    }
    setViewMonth((month) => month - 1)
  }

  const goNext = () => {
    if (viewMode === 'year') {
      setSlideDirection('next')
      setViewYear((year) => year + 1)
      return
    }
    if (viewMode === 'week') {
      setViewWeekStart((start) => addDays(start, 7))
      return
    }
    setSlideDirection('next')
    if (viewMonth === 11) {
      setViewYear((year) => year + 1)
      setViewMonth(0)
      return
    }
    setViewMonth((month) => month + 1)
  }

  const openMonthFromYear = (monthIndex: number) => {
    const cachedMonth = getCachedMonth(viewYear, monthIndex + 1)
    if (cachedMonth) {
      setCalendar(cachedMonth)
      setLoadedKey(buildCalendarRequestKey('month', viewYear, monthIndex, viewWeekStart))
    }
    setViewMonth(monthIndex)
    setViewMode('month')
  }

  const summaryText = useMemo(() => {
    if (viewMode === 'year') {
      if (!isSynced) return null
      const total = yearCalendars.reduce((sum, item) => sum + item.totalDays, 0)
      return t('checkin.summary.year', {
        period: formatYearLabel(viewYear, dateLocale),
        n: total,
      })
    }
    if (viewMode === 'week') {
      const total = weekDays.filter((date) => checkedDaySet.has(toDateKey(date))).length
      return t('checkin.summary.week', {
        period: formatWeekLabel(viewWeekStart, dateLocale, dateFormat),
        n: total,
      })
    }
    if (!isSynced || !calendar) return null
    return t('checkin.summary.month', {
      period: formatMonthLabel(viewYear, viewMonth, dateLocale, dateFormat),
      n: calendar.totalDays,
    })
  }, [
    calendar,
    checkedDaySet,
    dateFormat,
    dateLocale,
    isSynced,
    t,
    viewMode,
    viewMonth,
    viewWeekStart,
    viewYear,
    weekDays,
    yearCalendars,
  ])

  const layerClass = (mode: CalendarViewMode) =>
    `checkin-calendar-layer ${viewMode === mode ? 'is-active' : 'is-inactive'}`

  const slideClass = slideEnterClass(slideDirection)
  const handleSlideAnimationEnd = () => setSlideDirection(null)

  return (
    <section className="checkin-calendar-panel rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <CalendarDays size={18} className="text-neutral-500" strokeWidth={1.75} />
        <h3 className="text-base font-semibold text-neutral-900">{t('checkin.title')}</h3>
      </div>
      <p className="mt-1 text-sm text-neutral-500">{t('checkin.hint')}</p>

      {initialLoading && !status && (
        <p className="mt-4 text-sm text-neutral-400">{t('checkin.loading')}</p>
      )}

      {status && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: t('checkin.today'),
                value: status.checkedInToday ? t('checkin.done') : t('checkin.notDone'),
              },
              {
                label: t('checkin.currentStreak'),
                value: status.currentStreak,
                unit: t('checkin.daysUnit'),
              },
              {
                label: t('checkin.longestStreak'),
                value: status.longestStreak,
                unit: t('checkin.daysUnit'),
              },
              {
                label: t('checkin.total'),
                value: status.totalCheckIns,
                unit: t('checkin.daysUnit'),
              },
            ].map(({ label, value, unit }) => (
              <div key={label} className="rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-3">
                <p className="text-lg font-semibold text-neutral-900">
                  {value}
                  {unit && <span className="ml-0.5 text-xs font-normal text-neutral-400">{unit}</span>}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">{label}</p>
              </div>
            ))}
          </div>

          {status.checkinTier && (
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm">
              <p className="font-medium text-amber-900">
                {t('checkin.tierCurrent', { name: status.checkinTier.name })}
              </p>
              {status.checkinTier.nextTier && (
                <p className="mt-1 text-xs text-amber-800">
                  {t('checkin.tierNext', {
                    name: status.checkinTier.nextTier.name,
                    days: status.checkinTier.nextTier.daysRemaining,
                  })}
                </p>
              )}
            </div>
          )}

          {status.quote && (
            <p className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-700">
              {status.quote.content}
            </p>
          )}
        </>
      )}

      <div className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-sm font-medium text-neutral-800">{t('checkin.calendar')}</h4>
          <CalendarViewToggle
            value={viewMode}
            onChange={switchViewMode}
            label={(mode) => t(CALENDAR_VIEW_KEYS[mode])}
            ariaLabel={t('checkin.viewToggleAria')}
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
            aria-label={t('checkin.prev')}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-0 flex-1 truncate text-center text-sm text-neutral-700">
            {periodLabel}
          </span>
          <button
            type="button"
            onClick={goNext}
            className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
            aria-label={t('checkin.next')}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div
          ref={shellRef}
          className="checkin-calendar-shell relative mt-4"
          style={{ height: shellHeight }}
        >
          <div className={layerClass('year')} aria-hidden={viewMode !== 'year'}>
            <div
              ref={yearInnerRef}
              key={`year-${viewYear}`}
              className={`checkin-calendar-inner ${viewMode === 'year' ? slideClass : ''}`}
              onAnimationEnd={handleSlideAnimationEnd}
            >
              <YearCalendarView
                viewYear={viewYear}
                yearCalendars={yearCalendars}
                checkedDaySet={viewMode === 'year' ? checkedDaySet : new Set()}
                today={today}
                todayKey={todayKey}
                weekStartsOn={weekStartsOn}
                dateLocale={dateLocale}
                onOpenMonth={openMonthFromYear}
              />
            </div>
          </div>

          <div className={layerClass('month')} aria-hidden={viewMode !== 'month'}>
            <div
              ref={monthInnerRef}
              key={`month-${viewYear}-${viewMonth}`}
              className={`checkin-calendar-inner ${viewMode === 'month' ? slideClass : ''}`}
              onAnimationEnd={handleSlideAnimationEnd}
            >
              <MonthCalendarView
                calendarCells={calendarCells}
                checkedDaySet={viewMode === 'month' ? checkedDaySet : new Set()}
                todayKey={todayKey}
                weekdayLabels={weekdayLabels}
              />
            </div>
          </div>

          <div className={layerClass('week')} aria-hidden={viewMode !== 'week'}>
            <div ref={weekInnerRef} className="checkin-calendar-inner pt-1">
              <WeekCalendarView
                weekDays={weekDays}
                checkedDaySet={viewMode === 'week' ? checkedDaySet : new Set()}
                todayKey={todayKey}
                weekdayLabels={weekdayLabels}
                dateLocale={dateLocale}
                dateFormat={dateFormat}
              />
            </div>
          </div>

          {!isSynced && (
            <div className="pointer-events-none absolute right-0 top-0 z-10">
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-500" />
            </div>
          )}
        </div>

        {summaryText && (
          <p className="mt-3 min-h-[1.25rem] text-xs text-neutral-500 sm:text-sm">{summaryText}</p>
        )}

        {viewMode === 'year' && (
          <p className="mt-2 text-[11px] text-neutral-400 sm:text-xs">{t('checkin.monthClickHint')}</p>
        )}
      </div>
    </section>
  )
}
