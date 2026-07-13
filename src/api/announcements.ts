import { API_PATHS } from './config'
import { get, post } from './request'
import type { AnnouncementItem } from '../types'

export async function getAnnouncements(): Promise<AnnouncementItem[]> {
  const data = await get<{ items: AnnouncementItem[]; totalCount: number }>(
    API_PATHS.announcements.list,
  )
  return data.items
}

export async function markAnnouncementRead(id: string): Promise<void> {
  await post(API_PATHS.announcements.read(id))
}

export function countUnreadAnnouncements(items: AnnouncementItem[]): number {
  return items.filter((item) => !item.hasRead).length
}
