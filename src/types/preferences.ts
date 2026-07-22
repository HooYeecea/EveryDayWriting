/** 应用界面语言 */
export type AppLocale = 'zh' | 'en' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'pt' | 'ru'

export type AppTheme = 'light' | 'dark' | 'system'
export type EditorFontSize = 'sm' | 'md' | 'lg'
export type AutoSaveIntervalSec = 3 | 5 | 10
/** 0 = 周日，1 = 周一 */
export type WeekStartsOn = 0 | 1
export type DateFormatPref = 'locale' | 'ymd' | 'mdy'
export type DefaultHomePath = '/writing' | '/records' | '/user-center'

export const APP_LOCALES: AppLocale[] = ['zh', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'pt', 'ru']
export const APP_THEMES: AppTheme[] = ['light', 'dark', 'system']
export const EDITOR_FONT_SIZES: EditorFontSize[] = ['sm', 'md', 'lg']
export const AUTO_SAVE_INTERVALS: AutoSaveIntervalSec[] = [3, 5, 10]
export const DEFAULT_HOME_PATHS: DefaultHomePath[] = ['/writing', '/records', '/user-center']

export const APP_LOCALE_TO_BCP47: Record<AppLocale, string> = {
  zh: 'zh-CN',
  en: 'en-US',
  ja: 'ja-JP',
  ko: 'ko-KR',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
  pt: 'pt-BR',
  ru: 'ru-RU',
}

export interface UserPreferences {
  locale: AppLocale
  ui: {
    sidebarCollapsed: boolean
    reduceMotion: boolean
    theme: AppTheme
    weekStartsOn: WeekStartsOn
    dateFormat: DateFormatPref
    defaultHomePath: DefaultHomePath
  }
  writing: {
    typingAnimation: boolean
    /** 空字符串表示不预设 */
    defaultTopicType: string
    confirmBeforeSubmit: boolean
    editorFontSize: EditorFontSize
    defaultFullscreen: boolean
    autoSaveIntervalSec: AutoSaveIntervalSec
    timerSound: boolean
  }
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  locale: 'zh',
  ui: {
    sidebarCollapsed: false,
    reduceMotion: false,
    theme: 'light',
    weekStartsOn: 1,
    dateFormat: 'locale',
    defaultHomePath: '/writing',
  },
  writing: {
    typingAnimation: true,
    defaultTopicType: '',
    confirmBeforeSubmit: true,
    editorFontSize: 'md',
    defaultFullscreen: false,
    autoSaveIntervalSec: 3,
    timerSound: true,
  },
}
