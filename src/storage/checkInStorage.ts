import type { WritingCheckInRecord } from '../types'

const STORAGE_PREFIX = 'ew-check-ins'

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`
}

export function readLocalCheckIns(userId: string): WritingCheckInRecord[] {
  const raw = localStorage.getItem(storageKey(userId))
  if (!raw) return []

  try {
    return JSON.parse(raw) as WritingCheckInRecord[]
  } catch {
    return []
  }
}

export function writeLocalCheckIns(userId: string, records: WritingCheckInRecord[]): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(records))
}

export function appendLocalCheckIn(userId: string, record: WritingCheckInRecord): void {
  const records = readLocalCheckIns(userId)
  writeLocalCheckIns(userId, [...records, record])
}
