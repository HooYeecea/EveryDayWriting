import { API_PATHS } from './config'
import { get } from './request'
import type { CheckInCalendar, CheckInStatus, CheckInYearCalendar } from '../types'

export async function getCheckInStatus(): Promise<CheckInStatus> {
  return get<CheckInStatus>(API_PATHS.checkin.status)
}

/** 单月日历：year + month */
export async function getCheckInCalendar(year: number, month: number): Promise<CheckInCalendar> {
  return get<CheckInCalendar>(API_PATHS.checkin.calendar, {
    params: { year, month },
  })
}

/** 全年日历：只传 year，一次返回 12 个月 */
export async function getCheckInYearCalendar(year: number): Promise<CheckInYearCalendar> {
  return get<CheckInYearCalendar>(API_PATHS.checkin.calendar, {
    params: { year },
  })
}
