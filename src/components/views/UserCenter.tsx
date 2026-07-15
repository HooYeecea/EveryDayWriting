import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Camera,
  Check,
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
} from 'lucide-react'
import { updateUserProfile, uploadFile } from '../../api/user'
import { useAuth } from '../../context/AuthContext'
import { DEFAULT_PATH } from '../../config/routes'
import { AiAssistPanel } from '../user/AiAssistPanel'
import { AnnouncementsPanel } from '../user/AnnouncementsPanel'
import { PrivacySettingsPanel } from '../user/PrivacySettingsPanel'
import { TokenUsagePanel } from '../user/TokenUsagePanel'
import { WritingCheckInPanel } from '../user/WritingCheckInPanel'
import { resolveAssetUrl } from '../../utils/assetUrl'
import { getAvatarLabel, getVipLabel } from '../../utils/authValidation'
import { getFirstAllowedAdminPath } from '../../config/adminRoutes'
import { canAccessAdmin, hasUserRole } from '../../utils/roles'
import {
  PANEL_SUBTITLE_CLASS,
  PANEL_TITLE_CLASS,
} from '../layout/layoutConstants'

type UserTab = 'overview' | 'checkin' | 'usage' | 'settings'
type SlideDirection = 'prev' | 'next'

const TABS: { key: UserTab; label: string; icon: typeof Bell }[] = [
  { key: 'overview', label: '概览', icon: Bell },
  { key: 'checkin', label: '打卡', icon: CalendarDays },
  { key: 'usage', label: '用量', icon: Gauge },
  { key: 'settings', label: '设置', icon: Settings },
]

function tabPaneClass(active: boolean): string {
  // 非激活页用 opacity:0（勿用 visibility:hidden，日历层会用 visibility:visible 穿透）
  // 保持布局可测量，避免切入时高度从占位值突然跳变
  return active
    ? 'relative z-[1]'
    : 'pointer-events-none absolute inset-x-0 top-0 z-0 opacity-0'
}

export function UserCenter() {
  const { user, isAuthenticated, isLoading, logout, logoutAllDevices, refreshProfile, roles, permissions } =
    useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<UserTab>('overview')
  const [enterClass, setEnterClass] = useState('')
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)
  const [editingNickname, setEditingNickname] = useState(false)
  const [nicknameDraft, setNicknameDraft] = useState('')
  const [savingNickname, setSavingNickname] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarFileRef = useRef<HTMLInputElement>(null)
  const nicknameInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const paneRefs = useRef<Partial<Record<UserTab, HTMLDivElement | null>>>({})
  const pendingDirRef = useRef<SlideDirection | null>(null)

  const selectTab = (next: UserTab) => {
    if (next === tab) return
    const from = TABS.findIndex((item) => item.key === tab)
    const to = TABS.findIndex((item) => item.key === next)
    const direction: SlideDirection = to > from ? 'next' : 'prev'
    const toHeight = paneRefs.current[next]?.offsetHeight ?? 0

    // 高度一步到位（不做跟随滑动的高度过渡，避免动画过程中微抖）
    if (toHeight > 0) setViewportHeight(toHeight)

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
      // 同向连续切换时靠 reflow 重启动画，避免先清空 class 造成“闪一下”
      el.classList.remove('user-tab-enter-next', 'user-tab-enter-prev')
      void el.offsetWidth
      el.classList.add(cls)
    }
    setEnterClass(cls)

    const settled = paneRefs.current[tab]?.offsetHeight ?? 0
    if (settled > 0) setViewportHeight(settled)
  }, [tab])

  // 公告异步加载 / 展开折叠等会使当前页高度变化；同步视口，避免 overflow:hidden 裁切内容
  useLayoutEffect(() => {
    const pane = paneRefs.current[tab]
    if (!pane) return

    const syncHeight = () => {
      const next = pane.offsetHeight
      if (next > 0) setViewportHeight(next)
    }

    syncHeight()
    const observer = new ResizeObserver(syncHeight)
    observer.observe(pane)
    return () => observer.disconnect()
  }, [tab])

  const showAdminEntry =
    hasUserRole(roles) && canAccessAdmin(roles, permissions)

  useEffect(() => {
    if (!isAuthenticated) return
    void refreshProfile().catch(() => {
      // 统计刷新失败不影响页面展示
    })
  }, [isAuthenticated, refreshProfile])

  const handleLogout = async () => {
    await logout()
    navigate(DEFAULT_PATH, { replace: true })
  }

  const handleLogoutAll = async () => {
    if (!window.confirm('确定退出所有设备？当前设备也需要重新登录。')) return
    await logoutAllDevices()
    navigate(DEFAULT_PATH, { replace: true })
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">
        加载中…
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
          <LogIn size={28} className="text-neutral-400" strokeWidth={1.5} />
        </div>
        <h2 className="mt-5 text-lg font-medium text-neutral-800">您还未登录</h2>
        <p className="mt-2 max-w-sm text-center text-sm text-neutral-400">
          登录后即可查看个人信息、保存和提交写作
        </p>
        <div className="mt-6 flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:w-auto sm:flex-row">
          <Link
            to="/login"
            className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            立即登录
          </Link>
          <Link
            to="/register"
            className="rounded-lg border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            注册账号
          </Link>
        </div>
      </div>
    )
  }

  const stats = [
    { label: '累计写作', value: user.stats?.totalWritings ?? 0, unit: '篇', icon: PenLine },
    {
      label: '累计字数',
      value: (user.stats?.totalWords ?? 0).toLocaleString(),
      unit: '字',
      icon: Trophy,
    },
    { label: '词库词条', value: user.stats?.vocabularyCount ?? 0, unit: '个', icon: Calendar },
  ]

  const avatarSrc = avatarError ? null : resolveAssetUrl(user.avatar)
  const avatarLabel = getAvatarLabel({ nickname: user.nickname, avatar: user.avatar })

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

  return (
    <div
      ref={scrollRef}
      className="user-center-scroll flex-1 min-h-0 overflow-y-scroll overflow-anchor-none"
    >
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[5.25rem] w-full max-w-5xl items-center gap-3 sm:min-h-[5.5rem] sm:gap-4">
          <div className="min-w-0 shrink-0">
            <h2 className={PANEL_TITLE_CLASS}>用户中心</h2>
            <p className={`${PANEL_SUBTITLE_CLASS} max-w-[9rem] truncate sm:max-w-[14rem]`}>
              {user.nickname} · {getVipLabel(user.vipLevel)}
            </p>
          </div>

          <nav
            className="flex min-w-0 flex-1 items-center justify-center gap-2 sm:gap-3"
            aria-label="用户中心栏目"
          >
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => selectTab(key)}
                className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors sm:px-3 ${
                  tab === key
                    ? 'bg-neutral-900 font-medium text-white'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
                }`}
              >
                <Icon size={15} className="shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {showAdminEntry && (
              <button
                type="button"
                onClick={() => navigate(getFirstAllowedAdminPath(permissions))}
                className="flex items-center gap-1 rounded-lg border border-neutral-900 bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 sm:px-3"
              >
                <Shield size={12} />
                <span className="hidden sm:inline">管理后台</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-500 hover:bg-neutral-50 sm:px-3"
            >
              退出登录
            </button>
            <button
              type="button"
              onClick={() => void handleLogoutAll()}
              className="flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-500 hover:bg-neutral-50 sm:px-3"
              title="全部退出"
            >
              <LogOut size={12} />
              <span className="hidden lg:inline">全部退出</span>
            </button>
          </div>
        </div>
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
                <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
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
                  <div>
                    {editingNickname ? (
                      <div className="flex items-center gap-1.5">
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
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-lg font-medium text-neutral-900">{user.nickname}</h3>
                        <button
                          type="button"
                          onClick={startEditingNickname}
                          className="rounded-lg p-1 text-neutral-300 hover:bg-neutral-100 hover:text-neutral-500"
                          title="编辑昵称"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    )}
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500">
                      <Mail size={14} />
                      {user.email}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-400">
                      <Calendar size={13} />
                      加入时间：{new Date(user.createdAt).toLocaleDateString('zh-CN')}
                      {user.locationText && ` · ${user.locationText}`}
                    </div>
                  </div>
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
              <div className="mt-5">
                <AnnouncementsPanel />
              </div>
            </div>

            <div
              ref={(node) => {
                paneRefs.current.checkin = node
              }}
              className={tabPaneClass(tab === 'checkin')}
              aria-hidden={tab !== 'checkin'}
            >
              <WritingCheckInPanel />
            </div>

            <div
              ref={(node) => {
                paneRefs.current.usage = node
              }}
              className={tabPaneClass(tab === 'usage')}
              aria-hidden={tab !== 'usage'}
            >
              <TokenUsagePanel />
            </div>

            <div
              ref={(node) => {
                paneRefs.current.settings = node
              }}
              className={tabPaneClass(tab === 'settings')}
              aria-hidden={tab !== 'settings'}
            >
              <div className="space-y-5">
                {showAdminEntry && (
                  <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Shield size={18} className="text-neutral-500" />
                          <h3 className="text-sm font-medium text-neutral-900">管理后台</h3>
                        </div>
                        <p className="mt-2 text-sm text-neutral-400">
                          你同时拥有管理员角色，可以进入后台进行运营与系统配置。
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(getFirstAllowedAdminPath(permissions))}
                        className="shrink-0 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white hover:bg-neutral-800"
                      >
                        进入后台
                      </button>
                    </div>
                  </section>
                )}
                <AiAssistPanel />
                <PrivacySettingsPanel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
