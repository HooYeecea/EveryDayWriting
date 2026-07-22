import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Globe2, PenLine, RotateCcw, Settings2, Sparkles } from 'lucide-react'
import { TOPIC_TYPE_FILTER_OPTIONS } from '../../api/topics'
import { usePreferences } from '../../context/PreferencesContext'
import { useAuth } from '../../context/AuthContext'
import { useAppConfirm } from '../../context/AppConfirmContext'
import { useReportReady } from '../../hooks/useReportReady'
import { useT, translate } from '../../i18n'
import { clearLocalPreferenceCaches } from '../../storage/preferencesStorage'
import { pushPreferencesToServer } from '../../storage/preferencesSync'
import {
  APP_LOCALES,
  APP_THEMES,
  AUTO_SAVE_INTERVALS,
  DEFAULT_HOME_PATHS,
  DEFAULT_USER_PREFERENCES,
  EDITOR_FONT_SIZES,
  type AppLocale,
  type AppTheme,
  type AutoSaveIntervalSec,
  type DateFormatPref,
  type DefaultHomePath,
  type EditorFontSize,
  type UserPreferences,
  type WeekStartsOn,
} from '../../types/preferences'
import { MenuSelect } from '../common/MenuSelect'
import { MAIN_CONTENT_X_CLASS, PANEL_HEADER_CLASS, PANEL_TITLE_CLASS } from '../layout/layoutConstants'

function clonePrefs(value: UserPreferences): UserPreferences {
  return structuredClone(value)
}

function prefsEqual(a: UserPreferences, b: UserPreferences): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function SettingToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-neutral-900' : 'bg-neutral-200'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function SettingRow({
  title,
  description,
  control,
}: {
  title: string
  description: string
  control: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-neutral-100 py-4 last:border-b-0 last:pb-0 first:pt-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-neutral-800">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-neutral-500">{description}</p>
      </div>
      <div className="w-full shrink-0 sm:w-auto sm:pt-0.5">{control}</div>
    </div>
  )
}

const LOCALE_LABEL_KEY = {
  zh: 'settings.locale.zh',
  en: 'settings.locale.en',
  ja: 'settings.locale.ja',
  ko: 'settings.locale.ko',
} as const

const THEME_LABEL_KEY = {
  light: 'settings.theme.light',
  dark: 'settings.theme.dark',
  system: 'settings.theme.system',
} as const

const FONT_SIZE_LABEL_KEY = {
  sm: 'settings.editorFontSize.sm',
  md: 'settings.editorFontSize.md',
  lg: 'settings.editorFontSize.lg',
} as const

const HOME_PATH_LABEL_KEY = {
  '/writing': 'settings.defaultHome.writing',
  '/records': 'settings.defaultHome.records',
  '/user-center': 'settings.defaultHome.userCenter',
} as const

export function SystemSettings({ onReady }: { onReady?: () => void } = {}) {
  const { preferences, setPreferences } = usePreferences()
  const { isAuthenticated } = useAuth()
  const { confirm } = useAppConfirm()
  const t = useT()
  const [draft, setDraft] = useState<UserPreferences>(() => clonePrefs(preferences))
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const committedRef = useRef(preferences)

  useReportReady(true, onReady)

  const isDirty = useMemo(() => !prefsEqual(draft, preferences), [draft, preferences])

  useEffect(() => {
    setDraft((current) => {
      if (prefsEqual(current, committedRef.current)) {
        committedRef.current = preferences
        return clonePrefs(preferences)
      }
      if (prefsEqual(current, preferences)) {
        committedRef.current = preferences
        return current
      }
      committedRef.current = preferences
      return current
    })
  }, [preferences])

  const localeOptions = useMemo(
    () =>
      APP_LOCALES.map((locale) => ({
        value: locale,
        label: t(LOCALE_LABEL_KEY[locale]),
      })),
    [t],
  )

  const themeOptions = useMemo(
    () =>
      APP_THEMES.map((theme) => ({
        value: theme,
        label: t(THEME_LABEL_KEY[theme]),
      })),
    [t],
  )

  const weekStartOptions = useMemo(
    () => [
      { value: '1', label: t('settings.weekStartsOn.monday') },
      { value: '0', label: t('settings.weekStartsOn.sunday') },
    ],
    [t],
  )

  const dateFormatOptions = useMemo(
    () => [
      { value: 'locale', label: t('settings.dateFormat.locale') },
      { value: 'ymd', label: t('settings.dateFormat.ymd') },
      { value: 'mdy', label: t('settings.dateFormat.mdy') },
    ],
    [t],
  )

  const homePathOptions = useMemo(
    () =>
      DEFAULT_HOME_PATHS.map((path) => ({
        value: path,
        label: t(HOME_PATH_LABEL_KEY[path]),
      })),
    [t],
  )

  const fontSizeOptions = useMemo(
    () =>
      EDITOR_FONT_SIZES.map((size) => ({
        value: size,
        label: t(FONT_SIZE_LABEL_KEY[size]),
      })),
    [t],
  )

  const autoSaveOptions = useMemo(
    () =>
      AUTO_SAVE_INTERVALS.map((sec) => ({
        value: String(sec),
        label: t('settings.autoSaveInterval.sec', { n: sec }),
      })),
    [t],
  )

  const topicTypeOptions = useMemo(
    () => [
      { value: '', label: t('settings.defaultTopicType.none') },
      ...TOPIC_TYPE_FILTER_OPTIONS.filter((item) => item.value !== 'all').map((item) => ({
        value: item.value,
        label: item.label,
      })),
    ],
    [t],
  )

  const updateDraft = (patch: (current: UserPreferences) => UserPreferences) => {
    setMessage('')
    setDraft((current) => patch(current))
  }

  const handleSave = async () => {
    if (!isDirty || saving) return
    const next = clonePrefs(draft)
    setPreferences(next)
    if (!isAuthenticated) {
      setMessage(translate(next.locale, 'settings.saved'))
      return
    }
    setSaving(true)
    try {
      await pushPreferencesToServer(next)
      setMessage(translate(next.locale, 'settings.saved'))
    } catch {
      setMessage(translate(next.locale, 'settings.savedLocalOnly'))
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = () => {
    setDraft(clonePrefs(preferences))
    setMessage(translate(preferences.locale, 'settings.discarded'))
  }

  const handleClearLocal = async () => {
    if (isDirty) {
      const discardFirst = await confirm({
        title: t('settings.clearLocal.unsavedTitle'),
        message: t('settings.clearLocal.unsavedMessage'),
        confirmLabel: t('settings.clearLocal.unsavedConfirm'),
        variant: 'warning',
      })
      if (!discardFirst) return
    }

    const ok = await confirm({
      title: t('settings.clearLocal.confirmTitle'),
      message: t('settings.clearLocal.confirmMessage'),
      confirmLabel: t('settings.clearLocal.confirmLabel'),
      variant: 'warning',
    })
    if (!ok) return
    clearLocalPreferenceCaches()
    const defaults = clonePrefs(DEFAULT_USER_PREFERENCES)
    setPreferences(defaults)
    setDraft(defaults)
    if (!isAuthenticated) {
      setMessage(t('settings.clearLocal.done'))
      return
    }
    setSaving(true)
    try {
      await pushPreferencesToServer(defaults)
      setMessage(t('settings.clearLocal.done'))
    } catch {
      setMessage(t('settings.clearLocal.doneLocalOnly'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className={PANEL_HEADER_CLASS}>
        <div className="flex items-center gap-2">
          <Settings2 size={18} className="text-neutral-500" />
          <h1 className={PANEL_TITLE_CLASS}>{t('settings.title')}</h1>
          {isDirty ? (
            <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
              {t('settings.unsaved')}
            </span>
          ) : null}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto py-5 sm:py-8 ${MAIN_CONTENT_X_CLASS}`}>
        <div className="mx-auto max-w-2xl space-y-5 pb-24">
          <p className="text-sm leading-relaxed text-neutral-500">{t('settings.hint')}</p>

          {message ? (
            <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
              {message}
            </p>
          ) : null}

          <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Globe2 size={18} className="text-neutral-500" />
              <h2 className="text-sm font-medium text-neutral-900">{t('settings.section.ui')}</h2>
            </div>
            <SettingRow
              title={t('settings.locale.label')}
              description={t('settings.locale.desc')}
              control={
                <div className="w-full sm:w-44">
                  <MenuSelect
                    value={draft.locale}
                    options={localeOptions}
                    onChange={(value) =>
                      updateDraft((current) => ({ ...current, locale: value as AppLocale }))
                    }
                    ariaLabel={t('settings.locale.label')}
                  />
                </div>
              }
            />
            <SettingRow
              title={t('settings.theme')}
              description={t('settings.theme.desc')}
              control={
                <div className="w-full sm:w-44">
                  <MenuSelect
                    value={draft.ui.theme}
                    options={themeOptions}
                    onChange={(theme) =>
                      updateDraft((current) => ({
                        ...current,
                        ui: { ...current.ui, theme: theme as AppTheme },
                      }))
                    }
                    ariaLabel={t('settings.theme')}
                  />
                </div>
              }
            />
            <SettingRow
              title={t('settings.defaultHome')}
              description={t('settings.defaultHome.desc')}
              control={
                <div className="w-full sm:w-44">
                  <MenuSelect
                    value={draft.ui.defaultHomePath}
                    options={homePathOptions}
                    onChange={(defaultHomePath) =>
                      updateDraft((current) => ({
                        ...current,
                        ui: { ...current.ui, defaultHomePath: defaultHomePath as DefaultHomePath },
                      }))
                    }
                    ariaLabel={t('settings.defaultHome')}
                  />
                </div>
              }
            />
            <SettingRow
              title={t('settings.weekStartsOn')}
              description={t('settings.weekStartsOn.desc')}
              control={
                <div className="w-full sm:w-44">
                  <MenuSelect
                    value={String(draft.ui.weekStartsOn)}
                    options={weekStartOptions}
                    onChange={(value) =>
                      updateDraft((current) => ({
                        ...current,
                        ui: { ...current.ui, weekStartsOn: Number(value) as WeekStartsOn },
                      }))
                    }
                    ariaLabel={t('settings.weekStartsOn')}
                  />
                </div>
              }
            />
            <SettingRow
              title={t('settings.dateFormat')}
              description={t('settings.dateFormat.desc')}
              control={
                <div className="w-full sm:w-44">
                  <MenuSelect
                    value={draft.ui.dateFormat}
                    options={dateFormatOptions}
                    onChange={(dateFormat) =>
                      updateDraft((current) => ({
                        ...current,
                        ui: { ...current.ui, dateFormat: dateFormat as DateFormatPref },
                      }))
                    }
                    ariaLabel={t('settings.dateFormat')}
                  />
                </div>
              }
            />
            <SettingRow
              title={t('settings.sidebarCollapsed')}
              description={t('settings.sidebarCollapsed.desc')}
              control={
                <SettingToggle
                  label={t('settings.sidebarCollapsed')}
                  checked={draft.ui.sidebarCollapsed}
                  onChange={(sidebarCollapsed) =>
                    updateDraft((current) => ({
                      ...current,
                      ui: { ...current.ui, sidebarCollapsed },
                    }))
                  }
                />
              }
            />
            <SettingRow
              title={t('settings.reduceMotion')}
              description={t('settings.reduceMotion.desc')}
              control={
                <SettingToggle
                  label={t('settings.reduceMotion')}
                  checked={draft.ui.reduceMotion}
                  onChange={(reduceMotion) =>
                    updateDraft((current) => ({
                      ...current,
                      ui: { ...current.ui, reduceMotion },
                    }))
                  }
                />
              }
            />
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <PenLine size={18} className="text-neutral-500" />
              <h2 className="text-sm font-medium text-neutral-900">{t('settings.section.writing')}</h2>
            </div>
            <SettingRow
              title={t('settings.typingAnimation')}
              description={t('settings.typingAnimation.desc')}
              control={
                <SettingToggle
                  label={t('settings.typingAnimation')}
                  checked={draft.writing.typingAnimation}
                  onChange={(typingAnimation) =>
                    updateDraft((current) => ({
                      ...current,
                      writing: { ...current.writing, typingAnimation },
                    }))
                  }
                />
              }
            />
            <SettingRow
              title={t('settings.editorFontSize')}
              description={t('settings.editorFontSize.desc')}
              control={
                <div className="w-full sm:w-44">
                  <MenuSelect
                    value={draft.writing.editorFontSize}
                    options={fontSizeOptions}
                    onChange={(editorFontSize) =>
                      updateDraft((current) => ({
                        ...current,
                        writing: {
                          ...current.writing,
                          editorFontSize: editorFontSize as EditorFontSize,
                        },
                      }))
                    }
                    ariaLabel={t('settings.editorFontSize')}
                  />
                </div>
              }
            />
            <SettingRow
              title={t('settings.autoSaveInterval')}
              description={t('settings.autoSaveInterval.desc')}
              control={
                <div className="w-full sm:w-44">
                  <MenuSelect
                    value={String(draft.writing.autoSaveIntervalSec)}
                    options={autoSaveOptions}
                    onChange={(value) =>
                      updateDraft((current) => ({
                        ...current,
                        writing: {
                          ...current.writing,
                          autoSaveIntervalSec: Number(value) as AutoSaveIntervalSec,
                        },
                      }))
                    }
                    ariaLabel={t('settings.autoSaveInterval')}
                  />
                </div>
              }
            />
            <SettingRow
              title={t('settings.defaultTopicType')}
              description={t('settings.defaultTopicType.desc')}
              control={
                <div className="w-full sm:w-44">
                  <MenuSelect
                    value={draft.writing.defaultTopicType}
                    options={topicTypeOptions}
                    onChange={(defaultTopicType) =>
                      updateDraft((current) => ({
                        ...current,
                        writing: { ...current.writing, defaultTopicType },
                      }))
                    }
                    ariaLabel={t('settings.defaultTopicType')}
                  />
                </div>
              }
            />
            <SettingRow
              title={t('settings.defaultFullscreen')}
              description={t('settings.defaultFullscreen.desc')}
              control={
                <SettingToggle
                  label={t('settings.defaultFullscreen')}
                  checked={draft.writing.defaultFullscreen}
                  onChange={(defaultFullscreen) =>
                    updateDraft((current) => ({
                      ...current,
                      writing: { ...current.writing, defaultFullscreen },
                    }))
                  }
                />
              }
            />
            <SettingRow
              title={t('settings.confirmBeforeSubmit')}
              description={t('settings.confirmBeforeSubmit.desc')}
              control={
                <SettingToggle
                  label={t('settings.confirmBeforeSubmit')}
                  checked={draft.writing.confirmBeforeSubmit}
                  onChange={(confirmBeforeSubmit) =>
                    updateDraft((current) => ({
                      ...current,
                      writing: { ...current.writing, confirmBeforeSubmit },
                    }))
                  }
                />
              }
            />
            <SettingRow
              title={t('settings.timerSound')}
              description={t('settings.timerSound.desc')}
              control={
                <SettingToggle
                  label={t('settings.timerSound')}
                  checked={draft.writing.timerSound}
                  onChange={(timerSound) =>
                    updateDraft((current) => ({
                      ...current,
                      writing: { ...current.writing, timerSound },
                    }))
                  }
                />
              }
            />
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-neutral-500" />
              <h2 className="text-sm font-medium text-neutral-900">{t('settings.section.localData')}</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-800">{t('settings.clearLocal')}</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                  {t('settings.clearLocal.desc')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleClearLocal()}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                <RotateCcw size={14} />
                {t('settings.clearLocal.action')}
              </button>
            </div>
          </section>
        </div>
      </div>

      <div className="shrink-0 border-t border-neutral-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            disabled={!isDirty || saving}
            onClick={handleDiscard}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('settings.discard')}
          </button>
          <button
            type="button"
            disabled={!isDirty || saving}
            onClick={() => void handleSave()}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? t('settings.saving') : t('settings.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
