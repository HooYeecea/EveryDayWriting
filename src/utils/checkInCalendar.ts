import type { CheckInCalendar } from '../types'

export type CalendarViewMode = 'year' | 'month' | 'week'

export const CALENDAR_VIEW_LABELS: Record<CalendarViewMode, string> = {
  year: '年',
  month: '月',
  week: '周',
}

export const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

export interface CalendarCell {
  key: string
  day: number
  inMonth: boolean
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfWeekMonday(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const weekday = (result.getDay() + 6) % 7
  result.setDate(result.getDate() - weekday)
  return result
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  result.setDate(result.getDate() + days)
  return result
}

export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  const cells: CalendarCell[] = []

  for (let index = 0; index < 42; index += 1) {
    const dayOffset = index - firstWeekday + 1

    if (dayOffset < 1) {
      const day = daysInPrevMonth + dayOffset
      const prevMonth = month === 0 ? 11 : month - 1
      const prevYear = month === 0 ? year - 1 : year
      cells.push({
        key: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        day,
        inMonth: false,
      })
      continue
    }

    if (dayOffset > daysInMonth) {
      const day = dayOffset - daysInMonth
      const nextMonth = month === 11 ? 0 : month + 1
      const nextYear = month === 11 ? year + 1 : year
      cells.push({
        key: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        day,
        inMonth: false,
      })
      continue
    }

    cells.push({
      key: `${year}-${String(month + 1).padStart(2, '0')}-${String(dayOffset).padStart(2, '0')}`,
      day: dayOffset,
      inMonth: true,
    })
  }

  return cells
}

export function buildMonthMiniGrid(year: number, monthIndex: number): CalendarCell[] {
  const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cells: CalendarCell[] = []

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({ key: `${year}-${monthIndex}-pad-${index}`, day: 0, inMonth: false })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      key: `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      day,
      inMonth: true,
    })
  }

  return cells
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
}

export function getMonthKeysFromDates(dates: Date[]): Array<{ year: number; month: number }> {
  const keys = new Set<string>()
  for (const date of dates) {
    keys.add(`${date.getFullYear()}-${date.getMonth() + 1}`)
  }
  return Array.from(keys).map((key) => {
    const [year, month] = key.split('-')
    return { year: Number(year), month: Number(month) }
  })
}

export function buildCheckedDaySet(calendars: CheckInCalendar[]): Set<string> {
  const set = new Set<string>()
  for (const calendar of calendars) {
    for (const day of calendar.checkedDays) {
      set.add(
        `${calendar.year}-${String(calendar.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      )
    }
  }
  return set
}

export function formatYearLabel(year: number): string {
  return `${year}年`
}

export function formatMonthLabel(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
  })
}

export function formatWeekLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6)
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth()
  const sameYear = weekStart.getFullYear() === weekEnd.getFullYear()

  const startText = weekStart.toLocaleDateString('zh-CN', {
    year: sameYear ? undefined : 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const endText = weekEnd.toLocaleDateString('zh-CN', {
    year: sameYear ? undefined : 'numeric',
    month: sameMonth ? undefined : 'long',
    day: 'numeric',
  })

  return `${startText} - ${endText}`
}

export function getWeekAnchorDate(
  viewYear: number,
  viewMonth: number,
  today: Date,
  viewMode: CalendarViewMode,
): Date {
  if (viewMode === 'month') {
    if (viewYear === today.getFullYear() && viewMonth === today.getMonth()) {
      return today
    }
    return new Date(viewYear, viewMonth, 1)
  }

  if (viewYear === today.getFullYear()) {
    return today
  }

  return new Date(viewYear, 0, 1)
}

export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

export function buildCalendarRequestKey(
  mode: CalendarViewMode,
  year: number,
  monthIndex: number,
  weekStart: Date,
): string {
  return `${mode}|${year}|${monthIndex}|${toDateKey(weekStart)}`
}

export function createEmptyYearCalendars(year: number): CheckInCalendar[] {
  return Array.from({ length: 12 }, (_, index) => ({
    year,
    month: index + 1,
    checkedDays: [],
    streakStart: null,
    streakEnd: null,
    totalDays: 0,
  }))
}

export function measureElementHeight(node: HTMLElement | null): number {
  if (!node) return 0
  return Math.ceil(node.scrollHeight)
}

export function resolveTargetViewHeight(
  mode: CalendarViewMode,
  measured: number,
  cached: number,
  startHeight: number,
): number {
  if (measured <= 0) return cached
  if (mode === 'week') return measured
  if (measured >= startHeight - 1) return measured
  return Math.max(cached, startHeight)
}
