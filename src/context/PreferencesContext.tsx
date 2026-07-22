import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { UserPreferences } from '../types/preferences'
import { applyDocumentLang } from '../i18n'
import {
  applyAppearancePreferences,
  loadUserPreferences,
  saveUserPreferences,
} from '../storage/preferencesStorage'

interface PreferencesContextValue {
  preferences: UserPreferences
  setPreferences: (next: UserPreferences) => void
  patchPreferences: (patch: Partial<UserPreferences> | ((current: UserPreferences) => UserPreferences)) => void
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

function applyAll(next: UserPreferences) {
  saveUserPreferences(next)
  applyAppearancePreferences(next)
  applyDocumentLang(next.locale)
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferencesState] = useState<UserPreferences>(() => loadUserPreferences())

  useEffect(() => {
    applyAppearancePreferences(preferences)
    applyDocumentLang(preferences.locale)
  }, [preferences])

  // 跟随系统主题时监听系统变化
  useEffect(() => {
    if (preferences.ui.theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyAppearancePreferences(loadUserPreferences())
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [preferences.ui.theme])

  const setPreferences = useCallback((next: UserPreferences) => {
    applyAll(next)
    setPreferencesState(next)
  }, [])

  const patchPreferences = useCallback(
    (patch: Partial<UserPreferences> | ((current: UserPreferences) => UserPreferences)) => {
      setPreferencesState((current) => {
        const next =
          typeof patch === 'function'
            ? patch(current)
            : {
                ...current,
                ...patch,
                ui: { ...current.ui, ...patch.ui },
                writing: { ...current.writing, ...patch.writing },
              }
        applyAll(next)
        return next
      })
    },
    [],
  )

  const value = useMemo(
    () => ({ preferences, setPreferences, patchPreferences }),
    [preferences, setPreferences, patchPreferences],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider')
  }
  return context
}
