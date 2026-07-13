import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, Check, LogIn, LogOut, Mail, PenLine, Pencil, Trophy, Bell, Gauge, Settings, CalendarDays, X } from 'lucide-react'
import { logoutAll } from '../../api/auth'
import { updateUserProfile } from '../../api/user'
import { useAuth } from '../../context/AuthContext'
import { AiAssistPanel } from '../user/AiAssistPanel'
import { AnnouncementsPanel } from '../user/AnnouncementsPanel'
import { PrivacySettingsPanel } from '../user/PrivacySettingsPanel'
import { TokenUsagePanel } from '../user/TokenUsagePanel'
import { WritingCheckInPanel } from '../user/WritingCheckInPanel'
import { resolveAssetUrl } from '../../utils/assetUrl'
import { getAvatarLabel, getVipLabel } from '../../utils/authValidation'

type UserTab = 'overview' | 'checkin' | 'usage' | 'settings'

const TABS: { key: UserTab; label: string; icon: typeof Bell }[] = [
  { key: 'overview', label: '概览', icon: Bell },
  { key: 'checkin', label: '打卡', icon: CalendarDays },
  { key: 'usage', label: '用量', icon: Gauge },
  { key: 'settings', label: '设置', icon: Settings },
]

export function UserCenter() {
  const { user, isAuthenticated, isLoading, logout, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<UserTab>('overview')

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
    { label: '累计写作', value: user.stats.totalWritings, unit: '篇', icon: PenLine },
    { label: '累计字数', value: user.stats.totalWords.toLocaleString(), unit: '字', icon: Trophy },
    { label: '词库词条', value: user.stats.vocabularyCount ?? 0, unit: '个', icon: Calendar },
  ]

  const [editingNickname, setEditingNickname] = useState(false)
  const [nicknameDraft, setNicknameDraft] = useState(user.nickname)
  const [savingNickname, setSavingNickname] = useState(false)
  const nicknameInputRef = useRef<HTMLInputElement>(null)

  const avatarSrc = resolveAssetUrl(user.avatar)
  const avatarLabel = getAvatarLabel(user)

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
    if (e.key === 'Enter') saveNickname()
    if (e.key === 'Escape') cancelEditingNickname()
  }

  const handleLogoutAll = async () => {
    if (!window.confirm('确定退出所有设备？当前设备也需要重新登录。')) return
    await logoutAll()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-anchor-none">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">用户中心</h2>
              <p className="mt-0.5 text-sm text-neutral-400">
                {user.nickname} · {getVipLabel(user.vipLevel)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-50"
              >
                退出登录
              </button>
              <button
                type="button"
                onClick={() => void handleLogoutAll()}
                className="flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-50"
              >
                <LogOut size={12} />
                全部退出
              </button>
            </div>
          </div>

          {/* ── Tab bar ── */}
          <div className="mt-4 flex gap-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  tab === key
                    ? 'bg-neutral-900 font-medium text-white'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {/* ── Profile card (always visible) ── */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={user.nickname}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-lg font-semibold text-white">
                  {avatarLabel}
                </div>
              )}
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
                      onClick={saveNickname}
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

            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {stats.map(({ label, value, unit, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-center"
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

          {/* ── Tab panels ── */}
          <div className="mt-5">
            {tab === 'overview' && <AnnouncementsPanel />}
            {tab === 'checkin' && <WritingCheckInPanel />}
            {tab === 'usage' && <TokenUsagePanel />}
            {tab === 'settings' && (
              <div className="space-y-5">
                <AiAssistPanel />
                <PrivacySettingsPanel />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
