import {
  DEFAULT_USER_PREFERENCES,
  type AppLocale,
  type AppTheme,
  type AutoSaveIntervalSec,
  type DateFormatPref,
  type DefaultHomePath,
  type EditorFontSize,
  type UserPreferences,
  type WeekStartsOn,
} from '../types/preferences'

const PREFERENCES_KEY = 'ew_user_preferences'
const LEGACY_SIDEBAR_KEY = 'sidebar-collapsed'
const LEGACY_TYPING_KEY = 'ew_typing_animation'

function isLocale(value: unknown): value is AppLocale {
  return (
    value === 'zh' ||
    value === 'en' ||
    value === 'ja' ||
    value === 'ko' ||
    value === 'fr' ||
    value === 'de' ||
    value === 'es' ||
    value === 'pt' ||
    value === 'ru'
  )
}

function isTheme(value: unknown): value is AppTheme {
  return value === 'light' || value === 'dark' || value === 'system'
}

function isFontSize(value: unknown): value is EditorFontSize {
  return value === 'sm' || value === 'md' || value === 'lg'
}

function isAutoSave(value: unknown): value is AutoSaveIntervalSec {
  return value === 3 || value === 5 || value === 10
}

function isWeekStartsOn(value: unknown): value is WeekStartsOn {
  return value === 0 || value === 1
}

function isDateFormat(value: unknown): value is DateFormatPref {
  return value === 'locale' || value === 'ymd' || value === 'mdy'
}

function isHomePath(value: unknown): value is DefaultHomePath {
  return value === '/writing' || value === '/records' || value === '/user-center'
}

export function mergePreferences(raw: unknown): UserPreferences {
  const base = structuredClone(DEFAULT_USER_PREFERENCES)
  if (!raw || typeof raw !== 'object') return base
  const data = raw as Partial<UserPreferences>
  if (isLocale(data.locale)) base.locale = data.locale
  if (data.ui && typeof data.ui === 'object') {
    if (typeof data.ui.sidebarCollapsed === 'boolean') {
      base.ui.sidebarCollapsed = data.ui.sidebarCollapsed
    }
    if (typeof data.ui.reduceMotion === 'boolean') {
      base.ui.reduceMotion = data.ui.reduceMotion
    }
    if (isTheme(data.ui.theme)) base.ui.theme = data.ui.theme
    if (isWeekStartsOn(data.ui.weekStartsOn)) base.ui.weekStartsOn = data.ui.weekStartsOn
    if (isDateFormat(data.ui.dateFormat)) base.ui.dateFormat = data.ui.dateFormat
    if (isHomePath(data.ui.defaultHomePath)) base.ui.defaultHomePath = data.ui.defaultHomePath
  }
  if (data.writing && typeof data.writing === 'object') {
    if (typeof data.writing.typingAnimation === 'boolean') {
      base.writing.typingAnimation = data.writing.typingAnimation
    }
    if (typeof data.writing.defaultTopicType === 'string') {
      base.writing.defaultTopicType = data.writing.defaultTopicType
    }
    if (typeof data.writing.confirmBeforeSubmit === 'boolean') {
      base.writing.confirmBeforeSubmit = data.writing.confirmBeforeSubmit
    }
    if (isFontSize(data.writing.editorFontSize)) {
      base.writing.editorFontSize = data.writing.editorFontSize
    }
    if (typeof data.writing.defaultFullscreen === 'boolean') {
      base.writing.defaultFullscreen = data.writing.defaultFullscreen
    }
    if (isAutoSave(data.writing.autoSaveIntervalSec)) {
      base.writing.autoSaveIntervalSec = data.writing.autoSaveIntervalSec
    }
    if (typeof data.writing.timerSound === 'boolean') {
      base.writing.timerSound = data.writing.timerSound
    }
  }
  return base
}

function readLegacySeed(): Partial<UserPreferences> {
  const seed: Partial<UserPreferences> = {}
  try {
    const sidebar = localStorage.getItem(LEGACY_SIDEBAR_KEY)
    const typing = localStorage.getItem(LEGACY_TYPING_KEY)
    if (sidebar !== null || typing !== null) {
      seed.ui = {
        ...DEFAULT_USER_PREFERENCES.ui,
        sidebarCollapsed: sidebar === 'true',
      }
      seed.writing = {
        ...DEFAULT_USER_PREFERENCES.writing,
        typingAnimation: typing === null ? true : typing === 'true',
      }
    }
  } catch {
    // ignore
  }
  return seed
}

/**
 * 根据浏览器语言偏好映射到 AppLocale；对不上则回退产品默认（中文）。
 * 仅用于本机尚无偏好记录时的首访猜测。
 */
export function detectLocaleFromNavigator(
  languages: readonly string[] = typeof navigator === 'undefined'
    ? []
    : navigator.languages?.length
      ? [...navigator.languages]
      : navigator.language
        ? [navigator.language]
        : [],
): AppLocale {
  for (const tag of languages) {
    const primary = tag.trim().toLowerCase().split('-')[0]
    if (primary === 'zh') return 'zh'
    if (primary === 'en') return 'en'
    if (primary === 'ja') return 'ja'
    if (primary === 'ko') return 'ko'
    if (primary === 'fr') return 'fr'
    if (primary === 'de') return 'de'
    if (primary === 'es') return 'es'
    if (primary === 'pt') return 'pt'
    if (primary === 'ru') return 'ru'
  }
  return DEFAULT_USER_PREFERENCES.locale
}

function createInitialPreferences(): UserPreferences {
  const seeded = mergePreferences(readLegacySeed())
  seeded.locale = detectLocaleFromNavigator()
  return seeded
}

export function loadUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY)
    if (raw) return mergePreferences(JSON.parse(raw) as unknown)
    const seeded = createInitialPreferences()
    saveUserPreferences(seeded)
    return seeded
  } catch {
    return createInitialPreferences()
  }
}

export function saveUserPreferences(prefs: UserPreferences): void {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs))
  try {
    localStorage.setItem(LEGACY_SIDEBAR_KEY, String(prefs.ui.sidebarCollapsed))
    localStorage.setItem(LEGACY_TYPING_KEY, String(prefs.writing.typingAnimation))
  } catch {
    // ignore legacy mirror failures
  }
}

export function updateUserPreferences(
  patch: (current: UserPreferences) => UserPreferences,
): UserPreferences {
  const next = patch(loadUserPreferences())
  saveUserPreferences(next)
  return next
}

/** 清除本机偏好相关缓存（不含登录 token） */
export function clearLocalPreferenceCaches(): void {
  const keys = [PREFERENCES_KEY, LEGACY_SIDEBAR_KEY, LEGACY_TYPING_KEY, 'ew_writing_topic_panel_height']
  for (const key of keys) {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
  }
}

export function applyReduceMotionClass(enabled: boolean): void {
  document.documentElement.classList.toggle('ew-reduce-motion', enabled)
}

export function resolveTheme(theme: AppTheme): 'light' | 'dark' {
  if (theme === 'light' || theme === 'dark') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyThemeClass(theme: AppTheme): void {
  const resolved = resolveTheme(theme)
  document.documentElement.classList.toggle('ew-theme-dark', resolved === 'dark')
  document.documentElement.classList.toggle('ew-theme-light', resolved === 'light')
  document.documentElement.dataset.theme = resolved
}

export function applyEditorFontSizeClass(size: EditorFontSize): void {
  const root = document.documentElement
  root.classList.remove('ew-editor-font-sm', 'ew-editor-font-md', 'ew-editor-font-lg')
  root.classList.add(`ew-editor-font-${size}`)
}

export function applyAppearancePreferences(prefs: UserPreferences): void {
  applyReduceMotionClass(prefs.ui.reduceMotion)
  applyThemeClass(prefs.ui.theme)
  applyEditorFontSizeClass(prefs.writing.editorFontSize)
}
