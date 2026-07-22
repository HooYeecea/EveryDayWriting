import { API_PATHS } from './config'
import { get, put, uploadForm } from './request'
import type { UserPreferences } from '../types/preferences'

export async function updateUserProfile(payload: {
  nickname?: string
  avatar?: string
}): Promise<{ nickname: string; avatar: string | null }> {
  return put(API_PATHS.user.profile, payload)
}

export async function uploadFile(file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  return uploadForm<{ url: string }>(API_PATHS.files.upload, formData)
}

/** GET /user/preferences — 无记录时后端返回默认值 */
export async function getUserPreferences(): Promise<UserPreferences> {
  return get<UserPreferences>(API_PATHS.user.preferences)
}

/** PUT /user/preferences — 整份覆盖保存 */
export async function putUserPreferences(prefs: UserPreferences): Promise<UserPreferences> {
  return put<UserPreferences>(API_PATHS.user.preferences, prefs)
}
