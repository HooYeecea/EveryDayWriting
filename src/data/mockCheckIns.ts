import type { WritingCheckInRecord } from '../types'

/** 演示用静态打卡日期（YYYY-MM-DD），后续由后端接口替换 */
const MOCK_CHECK_IN_DATES: Record<string, string[]> = {
  'user-001': [
    '2026-05-08',
    '2026-05-12',
    '2026-05-15',
    '2026-05-20',
    '2026-05-22',
    '2026-06-02',
    '2026-06-05',
    '2026-06-08',
    '2026-06-10',
    '2026-06-12',
    '2026-06-15',
    '2026-06-18',
    '2026-06-20',
    '2026-06-22',
    '2026-06-23',
    '2026-06-24',
    '2026-06-25',
    '2026-06-26',
    '2026-06-27',
    '2026-06-28',
    '2026-06-29',
    '2026-06-30',
    '2026-07-01',
    '2026-07-02',
  ],
  'user-002': [
    '2026-06-28',
    '2026-06-29',
    '2026-07-01',
  ],
}

function toRecord(userId: string, date: string, index: number): WritingCheckInRecord {
  return {
    id: `mock-checkin-${userId}-${date}-${index}`,
    userId,
    date,
    checkedInAt: `${date}T09:30:00.000Z`,
  }
}

export function getMockCheckInRecords(userId: string): WritingCheckInRecord[] {
  const dates = MOCK_CHECK_IN_DATES[userId] ?? []
  return dates.map((date, index) => toRecord(userId, date, index))
}
