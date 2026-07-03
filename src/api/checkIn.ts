import { getMockCheckInRecords } from '../data/mockCheckIns'
import { appendLocalCheckIn, readLocalCheckIns } from '../storage/checkInStorage'
import type { WritingCheckInRecord } from '../types'

export function getTodayDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function mergeCheckInRecords(
  mockRecords: WritingCheckInRecord[],
  localRecords: WritingCheckInRecord[],
): WritingCheckInRecord[] {
  const map = new Map<string, WritingCheckInRecord>()

  for (const record of [...mockRecords, ...localRecords]) {
    const existing = map.get(record.date)
    if (!existing || record.checkedInAt > existing.checkedInAt) {
      map.set(record.date, record)
    }
  }

  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date))
}

/** 获取打卡记录（静态演示 + 本地追加，后续对接 GET /api/check-ins） */
export async function getCheckInRecords(userId: string): Promise<WritingCheckInRecord[]> {
  await delay()
  return mergeCheckInRecords(getMockCheckInRecords(userId), readLocalCheckIns(userId))
}

/** 今日打卡（后续对接 POST /api/check-ins） */
export async function checkInToday(userId: string): Promise<WritingCheckInRecord> {
  await delay()
  const today = getTodayDateKey()
  const records = await getCheckInRecords(userId)

  if (records.some((record) => record.date === today)) {
    throw new Error('今日已打卡')
  }

  const record: WritingCheckInRecord = {
    id: `local-checkin-${crypto.randomUUID()}`,
    userId,
    date: today,
    checkedInAt: new Date().toISOString(),
  }

  appendLocalCheckIn(userId, record)
  return record
}

export interface CheckInStats {
  totalDays: number
  currentStreak: number
  longestStreak: number
  thisMonthDays: number
}

export function computeCheckInStats(
  records: WritingCheckInRecord[],
  referenceDate = new Date(),
): CheckInStats {
  const dateSet = new Set(records.map((record) => record.date))
  const todayKey = getTodayDateKey(referenceDate)
  const monthPrefix = todayKey.slice(0, 7)

  return {
    totalDays: dateSet.size,
    currentStreak: computeCurrentStreak(dateSet, referenceDate),
    longestStreak: computeLongestStreak(dateSet),
    thisMonthDays: [...dateSet].filter((date) => date.startsWith(monthPrefix)).length,
  }
}

function computeCurrentStreak(dateSet: Set<string>, referenceDate: Date): number {
  const cursor = new Date(referenceDate)
  const todayKey = getTodayDateKey(cursor)

  if (!dateSet.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1)
  }

  let streak = 0

  while (true) {
    const key = getTodayDateKey(cursor)
    if (!dateSet.has(key)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function computeLongestStreak(dateSet: Set<string>): number {
  if (dateSet.size === 0) return 0

  const sorted = [...dateSet].sort()
  let longest = 1
  let current = 1

  for (let index = 1; index < sorted.length; index += 1) {
    const prev = new Date(`${sorted[index - 1]}T00:00:00`)
    const next = new Date(`${sorted[index]}T00:00:00`)
    const diffDays = Math.round((next.getTime() - prev.getTime()) / 86400000)

    if (diffDays === 1) {
      current += 1
      longest = Math.max(longest, current)
    } else {
      current = 1
    }
  }

  return longest
}

function delay(ms = 120) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
