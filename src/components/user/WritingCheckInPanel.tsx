import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, ChevronLeft, ChevronRight, Flame } from 'lucide-react'
import {
  checkInToday,
  computeCheckInStats,
  getCheckInRecords,
  getTodayDateKey,
} from '../../api/checkIn'
import type { WritingCheckInRecord } from '../../types'

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

interface CalendarCell {
  key: string
  day: number
  inMonth: boolean
}

function buildMonthGrid(year: number, month: number): CalendarCell[] {
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

function formatRecordTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface WritingCheckInPanelProps {
  userId: string
}

export function WritingCheckInPanel({ userId }: WritingCheckInPanelProps) {
  const today = useMemo(() => new Date(), [])
  const todayKey = getTodayDateKey(today)

  const [records, setRecords] = useState<WritingCheckInRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)
  const [message, setMessage] = useState('')
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const checkedDateSet = useMemo(() => new Set(records.map((record) => record.date)), [records])
  const hasCheckedToday = checkedDateSet.has(todayKey)
  const stats = useMemo(() => computeCheckInStats(records, today), [records, today])

  const monthRecords = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
    return records.filter((record) => record.date.startsWith(prefix))
  }, [records, viewMonth, viewYear])

  const calendarCells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewMonth, viewYear],
  )

  const monthLabel = useMemo(
    () =>
      new Date(viewYear, viewMonth, 1).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
      }),
    [viewMonth, viewYear],
  )

  const loadRecords = useCallback(async () => {
    setLoading(true)
    try {
      const list = await getCheckInRecords(userId)
      setRecords(list)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  const handleCheckIn = async () => {
    if (hasCheckedToday || checkingIn) return

    setCheckingIn(true)
    setMessage('')
    try {
      await checkInToday(userId)
      await loadRecords()
      setMessage('打卡成功，继续保持！')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '打卡失败')
    } finally {
      setCheckingIn(false)
    }
  }

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((year) => year - 1)
      setViewMonth(11)
      return
    }
    setViewMonth((month) => month - 1)
  }

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((year) => year + 1)
      setViewMonth(0)
      return
    }
    setViewMonth((month) => month + 1)
  }

  return (
    <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:mt-8 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-neutral-500" strokeWidth={1.75} />
            <h3 className="text-base font-semibold text-neutral-900">坚持写作打卡</h3>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              演示数据
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">每日完成写作即可打卡，记录你的坚持轨迹</p>
        </div>

        <button
          type="button"
          onClick={handleCheckIn}
          disabled={hasCheckedToday || checkingIn || loading}
          className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
            hasCheckedToday
              ? 'cursor-default bg-neutral-100 text-neutral-500'
              : 'bg-neutral-900 text-white hover:opacity-90 disabled:opacity-50'
          }`}
        >
          {hasCheckedToday ? (
            <>
              <Check size={16} />
              今日已打卡
            </>
          ) : (
            <>
              <Flame size={16} />
              {checkingIn ? '打卡中…' : '今日打卡'}
            </>
          )}
        </button>
      </div>

      {message && (
        <p className={`mt-3 text-sm ${message.includes('成功') ? 'text-emerald-600' : 'text-amber-600'}`}>
          {message}
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: '累计打卡', value: stats.totalDays, unit: '天' },
          { label: '当前连续', value: stats.currentStreak, unit: '天' },
          { label: '最长连续', value: stats.longestStreak, unit: '天' },
          { label: '本月打卡', value: stats.thisMonthDays, unit: '天' },
        ].map(({ label, value, unit }) => (
          <div key={label} className="rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-3">
            <p className="text-lg font-semibold text-neutral-900">
              {value}
              <span className="ml-0.5 text-xs font-normal text-neutral-400">{unit}</span>
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-neutral-800">打卡日历</h4>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goPrevMonth}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              aria-label="上一月"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[7rem] text-center text-sm text-neutral-700">{monthLabel}</span>
            <button
              type="button"
              onClick={goNextMonth}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              aria-label="下一月"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-neutral-400">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="py-1">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((cell) => {
            const checked = checkedDateSet.has(cell.key)
            const isToday = cell.key === todayKey

            return (
              <div
                key={cell.key}
                className={`flex aspect-square items-center justify-center rounded-lg text-xs ${
                  !cell.inMonth
                    ? 'text-neutral-300'
                    : checked
                      ? 'bg-neutral-900 font-medium text-white'
                      : isToday
                        ? 'border border-neutral-300 bg-white font-medium text-neutral-900'
                        : 'bg-neutral-50 text-neutral-600'
                }`}
                title={checked ? `${cell.key} 已打卡` : cell.key}
              >
                {cell.day}
              </div>
            )
          })}
        </div>

        <div className="mt-3 flex items-center gap-4 text-[11px] text-neutral-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-neutral-900" />
            已打卡
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-neutral-300 bg-white" />
            今天
          </span>
        </div>
      </div>

      <div className="mt-6 border-t border-neutral-100 pt-5">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-neutral-800">打卡记录</h4>
          <span className="text-xs text-neutral-400">{monthLabel} · {monthRecords.length} 天</span>
        </div>

        {loading && <p className="mt-3 text-sm text-neutral-400">加载中…</p>}

        {!loading && monthRecords.length === 0 && (
          <p className="mt-3 text-sm text-neutral-400">该月暂无打卡记录</p>
        )}

        {!loading && monthRecords.length > 0 && (
          <ul className="mt-3 space-y-2">
            {monthRecords.map((record) => (
              <li
                key={record.id}
                className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5 text-sm"
              >
                <span className="font-medium text-neutral-800">{record.date}</span>
                <span className="text-xs text-neutral-400">{formatRecordTime(record.checkedInAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
