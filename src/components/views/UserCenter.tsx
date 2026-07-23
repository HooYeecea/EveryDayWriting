import { useCallback, useLayoutEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useReportReady } from '../../hooks/useReportReady'
import {
  Calendar,
  Camera,
  Check,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  PenLine,
  Pencil,
  Trophy,
  Bell,
  Gauge,
  Settings,
  CalendarDays,
  X,
  Shield,
  Target,
} from 'lucide-react'
import { updateUserProfile, uploadFile } from '../../api/user'
import { useAuth } from '../../context/AuthContext'
import { useAppConfirm } from '../../context/AppConfirmContext'
import { DEFAULT_PATH } from '../../config/routes'
import { useT } from '../../i18n'
import type { MessageKey } from '../../i18n'
import { AiAssistPanel } from '../user/AiAssistPanel'
import { AnnouncementsPanel } from '../user/AnnouncementsPanel'
import { ChangePasswordDialog } from '../user/ChangePasswordDialog'
import { PersonalPlanPanel } from '../user/PersonalPlanPanel'
import { PrivacySettingsPanel } from '../user/PrivacySettingsPanel'
import { TokenUsagePanel } from '../user/TokenUsagePanel'
import {
  USER_TAB_LOADING_MIN_HEIGHT,
  UserTabContentGate,
} from '../user/UserTabContentGate'
import { WritingCheckInPanel } from '../user/WritingCheckInPanel'
import { resolveAssetUrl } from '../../utils/assetUrl'
import { getAvatarLabel } from '../../utils/authValidation'
import { getFirstAllowedAdminPath } from '../../config/adminPaths'
import { canAccessAdmin, hasUserRole } from '../../utils/roles'
import {
  PANEL_SUBTITLE_CLASS,
  PANEL_TITLE_CLASS,
} from '../layout/layoutConstants'

type UserTab = 'overview' | 'plan' | 'checkin' | 'usage' | 'settings'
type SlideDirection = 'prev' | 'next'

const TABS: { key: UserTab; labelKey: MessageKey; icon: typeof Bell }[] = [
  { key: 'overview', labelKey: 'userCenter.tab.overview', icon: Bell },
  { key: 'plan', labelKey: 'userCenter.tab.plan', icon: Target },
  { key: 'checkin', labelKey: 'userCenter.tab.checkin', icon: CalendarDays },
  { key: 'usage', labelKey: 'userCenter.tab.usage', icon: Gauge },
  { key: 'settings', labelKey: 'userCenter.tab.settings', icon: Settings },
]

const TAB_LOADING_KEYS: Record<UserTab, MessageKey> = {
  overview: 'userCenter.loading.overview',
  plan: 'userCenter.loading.plan',
  checkin: 'userCenter.loading.checkin',
  usage: 'userCenter.loading.usage',
  settings: 'userCenter.loading.settings',
}

function tabPaneClass(active: boolean): string {
  // 非激活页用 opacity:0（勿用 visibility:hidden，日历层会用 visibility:visible 穿透）
  // 保持布局可测量，避免切入时高度从占位值突然跳变
  return active
    ? 'relative z-[1]'
    : 'pointer-events-none absolute inset-x-0 top-0 z-0 opacity-0'
}

export function UserCenter({ onReady }: { onReady?: () => void } = {}) {
  const { user, isAuthenticated, isLoading, logout, logoutAllDevices, refreshProfile, roles, permissions } =
    useAuth()
  const { confirm } = useAppConfirm()
  const t = useT()
  const navigate = useNavigate()
  const location = useLocation()

  useReportReady(!isLoading, onReady)
  const initialTab =
    (location.state as { tab?: UserTab } | null)?.tab &&
    TABS.some((t) => t.key === (location.state as { tab?: UserTab }).tab)
      ? (location.state as { tab: UserTab }).tab
      : 'overview'
  const [tab, setTab] = useState<UserTab>(initialTab)
  const [visitedTabs, setVisitedTabs] = useState<Set<UserTab>>(() => new Set([initialTab]))
  const [readyTabs, setReadyTabs] = useState<Set<UserTab>>(() => new Set())
  const [settingsReadyParts, setSettingsReadyParts] = useState({ ai: false, privacy: false })
  const [enterClass, setEnterClass] = useState('')
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)
  const [editingNickname, setEditingNickname] = useState(false)
  const [nicknameDraft, setNicknameDraft] = useState('')
  const [savingNickname, setSavingNickname] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [tabsBelow, setTabsBelow] = useState(false)
  const avatarFileRef = useRef<HTMLInputElement>(null)
  const nicknameInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const headerRowRef = useRef<HTMLDivElement>(null)
  const headerTitleRef = useRef<HTMLDivElement>(null)
  const tabsMeasureRef = useRef<HTMLDivElement>(null)
  const actionsMeasureRef = useRef<HTMLDivElement>(null)
  /** Tab 下移时的视口宽度；变窄过程中即使内容区变宽也不得回到顶栏 */
  const tabsBelowAtViewportRef = useRef<number | null>(null)
  const paneRefs = useRef<Partial<Record<UserTab, HTMLDivElement | null>>>({})
  const pendingDirRef = useRef<SlideDirection | null>(null)

  const markTabReady = useCallback((key: UserTab) => {
    setReadyTabs((prev) => {
      if (prev.has(key)) return prev
      const next = new Set(prev)
      next.add(key)
      return next
    })
  }, [])

  const markSettingsPartReady = useCallback((part: 'ai' | 'privacy') => {
    setSettingsReadyParts((prev) => {
      if (prev[part]) return prev
      return { ...prev, [part]: true }
    })
  }, [])

  const selectTab = (next: UserTab) => {
    if (next === tab) return
    const from = TABS.findIndex((item) => item.key === tab)
    const to = TABS.findIndex((item) => item.key === next)
    const direction: SlideDirection = to > from ? 'next' : 'prev'

    if (next === 'overview' || readyTabs.has(next)) {
      const toHeight = paneRefs.current[next]?.offsetHeight ?? 0
      if (toHeight > 0) setViewportHeight(toHeight)
    } else {
      // 首次进入：先稳住加载态高度，避免空壳→内容撑开抖动
      setViewportHeight(USER_TAB_LOADING_MIN_HEIGHT)
    }

    setVisitedTabs((prev) => {
      if (prev.has(next)) return prev
      const nextSet = new Set(prev)
      nextSet.add(next)
      return nextSet
    })

    pendingDirRef.current = direction
    setTab(next)
    scrollRef.current?.scrollTo({ top: 0 })
  }

  useLayoutEffect(() => {
    const direction = pendingDirRef.current
    if (!direction) return
    pendingDirRef.current = null

    const cls = direction === 'next' ? 'user-tab-enter-next' : 'user-tab-enter-prev'
    const el = panelRef.current
    if (el) {
      el.classList.remove('user-tab-enter-next', 'user-tab-enter-prev')
      void el.offsetWidth
      el.classList.add(cls)
    }
    setEnterClass(cls)

    if (tab === 'overview' || readyTabs.has(tab)) {
      const settled = paneRefs.current[tab]?.offsetHeight ?? 0
      if (settled > 0) setViewportHeight(settled)
    } else {
      setViewportHeight(USER_TAB_LOADING_MIN_HEIGHT)
    }
  }, [tab, readyTabs])

  // 当前 Tab 就绪或内容高度变化时同步视口
  useLayoutEffect(() => {
    const pane = paneRefs.current[tab]
    if (!pane) return

    const syncHeight = () => {
      if (tab !== 'overview' && !readyTabs.has(tab)) {
        setViewportHeight(USER_TAB_LOADING_MIN_HEIGHT)
        return
      }
      const next = pane.offsetHeight
      if (next > 0) setViewportHeight(next)
    }

    syncHeight()
    const observer = new ResizeObserver(syncHeight)
    observer.observe(pane)
    return () => observer.disconnect()
  }, [tab, readyTabs])

  useLayoutEffect(() => {
    if (settingsReadyParts.ai && settingsReadyParts.privacy) {
      markTabReady('settings')
    }
  }, [markTabReady, settingsReadyParts.ai, settingsReadyParts.privacy])

  const showAdminEntry =
    hasUserRole(roles) && canAccessAdmin(roles, permissions)

  // 顶栏放不下完整菜单时切到下方；用「完整操作区」测量 + 视口锁定，避免侧栏/断点让内容区变宽时又跳回顶栏
  useLayoutEffect(() => {
    const row = headerRowRef.current
    const title = headerTitleRef.current
    const tabsMeasure = tabsMeasureRef.current
    const actionsMeasure = actionsMeasureRef.current
    if (!row || !title || !tabsMeasure || !actionsMeasure) return

    const GAPS = 32
    const ROW_UNLOCK = 48
    const VIEWPORT_UNLOCK = 96

    const syncTabsPlacement = () => {
      const needed =
        title.offsetWidth + actionsMeasure.scrollWidth + tabsMeasure.scrollWidth + GAPS
      const rowWidth = row.clientWidth
      const viewport = window.innerWidth

      setTabsBelow((prev) => {
        if (!prev) {
          if (rowWidth < needed) {
            tabsBelowAtViewportRef.current = viewport
            return true
          }
          return false
        }

        const droppedAt = tabsBelowAtViewportRef.current ?? viewport
        const canReturn =
          viewport >= droppedAt + VIEWPORT_UNLOCK && rowWidth >= needed + ROW_UNLOCK
        if (canReturn) {
          tabsBelowAtViewportRef.current = null
          return false
        }
        return true
      })
    }

    syncTabsPlacement()
    const observer = new ResizeObserver(syncTabsPlacement)
    observer.observe(row)
    observer.observe(title)
    observer.observe(tabsMeasure)
    observer.observe(actionsMeasure)
    window.addEventListener('resize', syncTabsPlacement)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncTabsPlacement)
    }
  }, [showAdminEntry, user?.nickname, user?.vipLevel])

  const handleLogout = async () => {
    await logout()
    navigate(DEFAULT_PATH, { replace: true })
  }

  const handleLogoutAll = async () => {
    const ok = await confirm({
      title: t('userCenter.logoutAllConfirmTitle'),
      message: t('userCenter.logoutAllConfirmMessage'),
      confirmLabel: t('userCenter.logoutAll'),
      variant: 'warning',
    })
    if (!ok) return
    await logoutAllDevices()
    navigate(DEFAULT_PATH, { replace: true })
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">
        {t('common.loading')}
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
          <LogIn size={28} className="text-neutral-400" strokeWidth={1.5} />
        </div>
        <h2 className="mt-5 text-lg font-medium text-neutral-800">{t('auth.loginRequiredTitle')}</h2>
        <p className="mt-2 max-w-sm text-center text-sm text-neutral-400">
          {t('userCenter.loginGate')}
        </p>
        <div className="mt-6 flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:w-auto sm:flex-row">
          <Link
            to="/login"
            className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            {t('nav.loginNow')}
          </Link>
          <Link
            to="/register"
            className="rounded-lg border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {t('auth.loginRequiredRegister')}
          </Link>
        </div>
      </div>
    )
  }

  const stats = [
    { label: t('userCenter.stat.writings'), value: user.stats?.totalWritings ?? 0, unit: t('userCenter.stat.writingsUnit'), icon: PenLine },
    {
      label: t('userCenter.stat.words'),
      value: (user.stats?.totalWords ?? 0).toLocaleString(),
      unit: '',
      icon: Trophy,
    },
    { label: t('userCenter.stat.vocab'), value: user.stats?.vocabularyCount ?? 0, unit: t('userCenter.stat.vocabUnit'), icon: Calendar },
  ]

  const avatarSrc = avatarError ? null : resolveAssetUrl(user.avatar)
  const avatarLabel = getAvatarLabel({ nickname: user.nickname, avatar: user.avatar })

  const vipLabel =
    user.vipLevel > 0 ? t('userCenter.vip.badge') : t('userCenter.vip.regular')

  const startEditingNickname = () => {
    setNicknameDraft(user.nickname)
    setEditingNickname(true)
    setTimeout(() => nicknameInputRef.current?.focus(), 0)
  }

  const cancelEditingNickname = () => {
    setEditingNickname(false)
    setNicknameDraft(user.nickname)
  }

  const saveNickname = async () => {
    const trimmed = nicknameDraft.trim()
    if (!trimmed || trimmed === user.nickname) {
      setEditingNickname(false)
      return
    }
    setSavingNickname(true)
    try {
      await updateUserProfile({ nickname: trimmed })
      await refreshProfile()
    } catch {
      // keep editing state on failure
    } finally {
      setSavingNickname(false)
      setEditingNickname(false)
    }
  }

  const handleNicknameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void saveNickname()
    if (e.key === 'Escape') cancelEditingNickname()
  }

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const { url } = await uploadFile(file)
      await updateUserProfile({ avatar: url })
      await refreshProfile()
      setAvatarError(false)
    } catch {
      // silently fail, avatar stays as-is
    } finally {
      setAvatarUploading(false)
      event.target.value = ''
    }
  }

  const renderTabs = (variant: 'inline' | 'below') =>
    TABS.map(({ key, labelKey, icon: Icon }) => (
      <button
        key={key}
        type="button"
        onClick={() => selectTab(key)}
        className={
          variant === 'below'
            ? `flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-lg px-2 py-2 text-xs transition-colors ${
                tab === key
                  ? 'bg-neutral-900 font-medium text-white'
                  : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
              }`
            : `flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors ${
                tab === key
                  ? 'bg-neutral-900 font-medium text-white'
                  : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
              }`
        }
      >
        <Icon size={15} className="shrink-0" />
        {t(labelKey)}
      </button>
    ))

  return (
    <div
      ref={scrollRef}
      className="user-center-scroll flex-1 min-h-0 overflow-y-scroll overflow-anchor-none"
    >
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
        <div
          ref={tabsMeasureRef}
          className="pointer-events-none fixed left-0 top-0 -z-10 flex w-max gap-3 opacity-0"
          aria-hidden
        >
          {TABS.map(({ key, labelKey, icon: Icon }) => (
            <span
              key={key}
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-sm"
            >
              <Icon size={15} />
              {t(labelKey)}
            </span>
          ))}
        </div>
        {/* 始终按桌面完整文案测量，避免 sm/lg 缩短按钮后「可用宽度」虚增 */}
        <div
          ref={actionsMeasureRef}
          className="pointer-events-none fixed left-0 top-0 -z-10 flex w-max items-center gap-2 opacity-0"
          aria-hidden
        >
          {showAdminEntry && (
            <span className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs">
              <Shield size={12} />
              {t('userCenter.admin')}
            </span>
          )}
          <span className="rounded-lg border px-3 py-1.5 text-xs">{t('userCenter.logout')}</span>
          <span className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs">
            <LogOut size={12} />
            {t('userCenter.logoutAll')}
          </span>
        </div>

        <div className="px-4 sm:px-6 lg:px-8">
          <div
            ref={headerRowRef}
            className="mx-auto flex min-h-[5.25rem] w-full max-w-5xl items-center gap-3 sm:min-h-[5.5rem] sm:gap-4"
          >
            <div ref={headerTitleRef} className="min-w-0 shrink-0">
              <h2 className={PANEL_TITLE_CLASS}>{t('userCenter.title')}</h2>
              <p className={`${PANEL_SUBTITLE_CLASS} max-w-[9rem] truncate sm:max-w-[14rem]`}>
                {user.nickname} · {vipLabel}
              </p>
            </div>

            {!tabsBelow ? (
              <nav
                className="flex min-w-0 flex-1 items-center justify-center gap-3"
                aria-label={t('userCenter.title')}
              >
                {renderTabs('inline')}
              </nav>
            ) : (
              <div className="min-w-0 flex-1" aria-hidden />
            )}

            <div className="ml-auto flex shrink-0 items-center gap-2">
              {showAdminEntry && (
                <button
                  type="button"
                  onClick={() => navigate(getFirstAllowedAdminPath(permissions))}
                  className="flex items-center gap-1 rounded-lg border border-neutral-900 bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 sm:px-3"
                  title={t('userCenter.admin')}
                >
                  <Shield size={12} />
                  <span className="hidden sm:inline">{t('userCenter.admin')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-500 hover:bg-neutral-50 sm:px-3"
              >
                <span className="sm:hidden">{t('userCenter.logoutShort')}</span>
                <span className="hidden sm:inline">{t('userCenter.logout')}</span>
              </button>
              <button
                type="button"
                onClick={() => void handleLogoutAll()}
                className="flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-500 hover:bg-neutral-50 sm:px-3"
                title={t('userCenter.logoutAll')}
              >
                <LogOut size={12} />
                <span className="hidden lg:inline">{t('userCenter.logoutAll')}</span>
              </button>
            </div>
          </div>
        </div>

        {tabsBelow ? (
          <nav
            className="border-t border-neutral-100 px-3 pb-2.5 pt-2"
            aria-label={t('userCenter.title')}
          >
            <div className="mx-auto flex max-w-5xl gap-1">{renderTabs('below')}</div>
          </nav>
        ) : null}
      </div>

      <div className="px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div
          className="user-tab-viewport mx-auto max-w-2xl"
          style={viewportHeight != null ? { height: viewportHeight } : undefined}
        >
          <div
            ref={panelRef}
            className={`user-tab-panel relative ${enterClass}`}
            onAnimationEnd={(event) => {
              if (event.target !== event.currentTarget) return
              setEnterClass('')
              const settled = paneRefs.current[tab]?.offsetHeight ?? 0
              setViewportHeight(settled > 0 ? settled : null)
            }}
          >
            <div
              ref={(node) => {
                paneRefs.current.overview = node
              }}
              className={tabPaneClass(tab === 'overview')}
              aria-hidden={tab !== 'overview'}
            >
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
                    <button
                      type="button"
                      onClick={() => avatarFileRef.current?.click()}
                      disabled={avatarUploading}
                      className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-900 text-lg font-semibold text-white"
                    >
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={user.nickname}
                          className="h-full w-full object-cover"
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        avatarLabel
                      )}
                      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        {avatarUploading ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Camera size={16} />
                        )}
                      </span>
                    </button>
                    <input
                      ref={avatarFileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <div className="min-w-0">
                      {editingNickname ? (
                        <div className="flex items-center justify-center gap-1.5 sm:justify-start">
                          <input
                            ref={nicknameInputRef}
                            value={nicknameDraft}
                            onChange={(e) => setNicknameDraft(e.target.value)}
                            onKeyDown={handleNicknameKeyDown}
                            maxLength={50}
                            disabled={savingNickname}
                            className="w-40 rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-lg font-medium text-neutral-900 outline-none focus:border-neutral-500"
                          />
                          <button
                            type="button"
                            onClick={() => void saveNickname()}
                            disabled={savingNickname}
                            className="rounded-lg p-1 text-green-600 hover:bg-green-50"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditingNickname}
                            disabled={savingNickname}
                            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 sm:justify-start">
                          <h3 className="text-lg font-medium text-neutral-900">{user.nickname}</h3>
                          <button
                            type="button"
                            onClick={startEditingNickname}
                            className="rounded-lg p-1 text-neutral-300 hover:bg-neutral-100 hover:text-neutral-500"
                            title={t('userCenter.editNickname')}
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      )}
                      <div className="mt-1 flex items-center justify-center gap-1.5 text-sm text-neutral-500 sm:justify-start">
                        <Mail size={14} className="shrink-0" />
                        <span className="min-w-0 break-all">{user.email}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-neutral-400 sm:justify-start">
                        <Calendar size={13} className="shrink-0" />
                        <span>
                          {t('userCenter.joinedAt')}
                          {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                          {user.locationText && ` · ${user.locationText}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setChangePasswordOpen(true)}
                    className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-white sm:w-auto sm:self-center"
                  >
                    <KeyRound size={14} strokeWidth={1.75} />
                    {t('userCenter.changePassword')}
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  {stats.map(({ label, value, unit, icon: Icon }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-center transition-transform duration-200 hover:-translate-y-1 hover:shadow-sm"
                    >
                      <Icon size={16} className="mx-auto text-neutral-400" strokeWidth={1.5} />
                      <p className="mt-2 text-lg font-semibold text-neutral-900 sm:text-xl">
                        {value}
                        <span className="ml-0.5 text-xs font-normal text-neutral-400">{unit}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-400">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
              {user.proficiencyOnboarding &&
                user.proficiencyOnboarding.status !== 'completed' && (
                  <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm font-medium text-neutral-800">
                      {t('userCenter.proficiency.title')}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {t('userCenter.proficiency.hint')}
                    </p>
                    <Link
                      to="/proficiency-test"
                      className="mt-3 inline-flex text-xs font-medium text-neutral-900 underline underline-offset-2"
                    >
                      {user.proficiencyOnboarding.status === 'in_progress'
                        ? t('userCenter.proficiency.continue')
                        : t('userCenter.proficiency.start')}
                    </Link>
                  </div>
                )}
              <div className="mt-5">
                {visitedTabs.has('overview') && (
                  <AnnouncementsPanel onReady={() => markTabReady('overview')} />
                )}
              </div>
            </div>

            <div
              ref={(node) => {
                paneRefs.current.plan = node
              }}
              className={tabPaneClass(tab === 'plan')}
              aria-hidden={tab !== 'plan'}
            >
              {visitedTabs.has('plan') && (
                <UserTabContentGate
                  ready={readyTabs.has('plan')}
                  loadingLabel={t(TAB_LOADING_KEYS.plan)}
                >
                  <PersonalPlanPanel onReady={() => markTabReady('plan')} />
                </UserTabContentGate>
              )}
            </div>

            <div
              ref={(node) => {
                paneRefs.current.checkin = node
              }}
              className={tabPaneClass(tab === 'checkin')}
              aria-hidden={tab !== 'checkin'}
            >
              {visitedTabs.has('checkin') && (
                <UserTabContentGate
                  ready={readyTabs.has('checkin')}
                  loadingLabel={t(TAB_LOADING_KEYS.checkin)}
                  minHeight={360}
                >
                  <WritingCheckInPanel onReady={() => markTabReady('checkin')} />
                </UserTabContentGate>
              )}
            </div>

            <div
              ref={(node) => {
                paneRefs.current.usage = node
              }}
              className={tabPaneClass(tab === 'usage')}
              aria-hidden={tab !== 'usage'}
            >
              {visitedTabs.has('usage') && (
                <UserTabContentGate
                  ready={readyTabs.has('usage')}
                  loadingLabel={t(TAB_LOADING_KEYS.usage)}
                >
                  <TokenUsagePanel onReady={() => markTabReady('usage')} />
                </UserTabContentGate>
              )}
            </div>

            <div
              ref={(node) => {
                paneRefs.current.settings = node
              }}
              className={tabPaneClass(tab === 'settings')}
              aria-hidden={tab !== 'settings'}
            >
              {visitedTabs.has('settings') && (
                <UserTabContentGate
                  ready={readyTabs.has('settings')}
                  loadingLabel={t(TAB_LOADING_KEYS.settings)}
                  minHeight={320}
                >
                  <div className="space-y-5">
                    {showAdminEntry && (
                      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <Shield size={18} className="text-neutral-500" />
                              <h3 className="text-sm font-medium text-neutral-900">
                                {t('userCenter.admin')}
                              </h3>
                            </div>
                            <p className="mt-2 text-sm text-neutral-400">
                              {t('userCenter.admin.description')}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigate(getFirstAllowedAdminPath(permissions))}
                            className="shrink-0 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white hover:bg-neutral-800"
                          >
                            {t('userCenter.admin.enter')}
                          </button>
                        </div>
                      </section>
                    )}
                    <AiAssistPanel onReady={() => markSettingsPartReady('ai')} />
                    <PrivacySettingsPanel onReady={() => markSettingsPartReady('privacy')} />
                  </div>
                </UserTabContentGate>
              )}
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </div>
  )
}
