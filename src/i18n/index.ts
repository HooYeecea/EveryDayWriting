import { useCallback } from 'react'
import { usePreferences } from '../context/PreferencesContext'
import type { AppLocale } from '../types/preferences'
import {
  LOCALE_HTML_LANG,
  translate,
  type MessageKey,
} from './messages'

export type { MessageKey } from './messages'
export { getRouteLabelKey, LOCALE_HTML_LANG, translate } from './messages'

export function applyDocumentLang(locale: AppLocale): void {
  document.documentElement.lang = LOCALE_HTML_LANG[locale] ?? 'zh-CN'
}

/** 当前已保存语言的翻译函数 */
export function useT() {
  const { preferences } = usePreferences()
  const locale = preferences.locale

  return useCallback(
    (key: MessageKey, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale],
  )
}

/** 指定语言翻译（设置页草稿预览等） */
export function useTLocale(locale: AppLocale) {
  return useCallback(
    (key: MessageKey, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale],
  )
}
