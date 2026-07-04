import { API_PATHS } from './config'
import { get } from './request'
import type { CheckInCalendar, CheckInStatus } from '../types'

export async function getCheckInStatus(): Promise<CheckInStatus> {
  return get<CheckInStatus>(API_PATHS.checkin.status)
}

export async function getCheckInCalendar(year: number, month: number): Promise<CheckInCalendar> {
  return get<CheckInCalendar>(API_PATHS.checkin.calendar, {
    params: { year, month },
  })
}
