import { getUserPreferences, putUserPreferences } from '../api/user'
import { applyDocumentLang } from '../i18n'
import type { UserPreferences } from '../types/preferences'
import {
  applyAppearancePreferences,
  loadUserPreferences,
  mergePreferences,
  saveUserPreferences,
} from './preferencesStorage'

let syncInFlight: Promise<UserPreferences> | null = null

/**
 * 从服务端拉取偏好，校验合并后写入本机并应用外观/语言。
 * 并发调用共用同一 Promise，避免登录与 Provider 重复请求。
 */
export async function syncPreferencesFromServer(): Promise<UserPreferences> {
  if (syncInFlight) return syncInFlight

  syncInFlight = (async () => {
    const remote = await getUserPreferences()
    const merged = mergePreferences(remote)
    saveUserPreferences(merged)
    applyAppearancePreferences(merged)
    applyDocumentLang(merged.locale)
    return merged
  })().finally(() => {
    syncInFlight = null
  })

  return syncInFlight
}

/** 将当前偏好推送到服务端；失败时抛出，本机已由调用方写入 */
export async function pushPreferencesToServer(prefs: UserPreferences): Promise<UserPreferences> {
  const saved = await putUserPreferences(prefs)
  return mergePreferences(saved)
}

export function readLocalPreferences(): UserPreferences {
  return loadUserPreferences()
}
