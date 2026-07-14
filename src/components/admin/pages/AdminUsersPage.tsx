import { useCallback, useEffect, useState } from 'react'
import {
  banAdminUser,
  getAdminUserDetail,
  listAdminRoles,
  listAdminUsers,
  assignAdminUserRoles,
  unbanAdminUser,
  updateAdminUserVip,
  type AdminRoleItem,
  type AdminUserDetail,
  type AdminUserListItem,
} from '../../../api/admin'
import { useAuth } from '../../../context/AuthContext'
import { hasPermission } from '../../../utils/roles'
import {
  AdminCard,
  AdminEmpty,
  AdminError,
  AdminField,
  AdminGhostButton,
  AdminModal,
  AdminPageBody,
  AdminPageHeader,
  AdminPrimaryButton,
} from '../AdminUi'

export function AdminUsersPage() {
  const { permissions, user: currentUser, refreshAccess } = useAuth()
  const canDetail = hasPermission(permissions, 'user:detail')
  const canBan = hasPermission(permissions, 'user:ban')
  const canVip = hasPermission(permissions, 'user:vip')
  const canAssignRoles = hasPermission(permissions, 'role:manage')

  const [items, setItems] = useState<AdminUserListItem[]>([])
  const [roles, setRoles] = useState<AdminRoleItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const [detail, setDetail] = useState<AdminUserDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [roleUser, setRoleUser] = useState<AdminUserListItem | null>(null)
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const [savingRoles, setSavingRoles] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [users, roleData] = await Promise.all([
        listAdminUsers({ page, pageSize: 20, search: search.trim() || undefined }),
        listAdminRoles(),
      ])
      setItems(users.items)
      setTotalPages(users.totalPages || 1)
      setRoles(roleData.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载用户失败')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    void load()
  }, [load])

  const openDetail = async (id: string) => {
    setDetailLoading(true)
    setError('')
    try {
      setDetail(await getAdminUserDetail(id))
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载用户详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  const openRoles = (user: AdminUserListItem) => {
    setRoleUser(user)
    setSelectedRoleIds(user.roles?.map((r) => r.id) ?? [])
  }

  const saveRoles = async () => {
    if (!roleUser) return
    setSavingRoles(true)
    setError('')
    try {
      await assignAdminUserRoles(roleUser.id, selectedRoleIds)
      setRoleUser(null)
      await load()
      if (currentUser?.id === roleUser.id) {
        await refreshAccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '分配角色失败')
    } finally {
      setSavingRoles(false)
    }
  }

  const handleBanToggle = async (user: AdminUserListItem) => {
    const reason = user.isBanned ? undefined : window.prompt('封禁原因', '违反社区规范')
    if (!user.isBanned && reason === null) return
    setBusyId(user.id)
    try {
      if (user.isBanned) {
        await unbanAdminUser(user.id, '管理员解封')
      } else {
        await banAdminUser(user.id, reason || '违反社区规范')
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setBusyId(null)
    }
  }

  const handleVip = async (user: AdminUserListItem) => {
    const input = window.prompt('设置 VIP 等级（0-3）', String(user.vipLevel))
    if (input === null) return
    const vipLevel = Number(input)
    if (!Number.isInteger(vipLevel) || vipLevel < 0) {
      setError('VIP 等级无效')
      return
    }
    setBusyId(user.id)
    try {
      await updateAdminUserVip(user.id, vipLevel)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新 VIP 失败')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader
        title="用户管理"
        description="检索用户、详情、封禁、VIP 与角色分配"
        actions={
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              setPage(1)
              void load()
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索邮箱 / 昵称"
              className="w-44 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs outline-none focus:border-neutral-400 focus:bg-white sm:w-56"
            />
            <AdminPrimaryButton type="submit">搜索</AdminPrimaryButton>
          </form>
        }
      />
      <AdminPageBody>
        {error ? (
          <div className="mb-4">
            <AdminError message={error} />
          </div>
        ) : null}
        <AdminCard className="overflow-hidden p-0 sm:p-0">
          {loading ? (
            <AdminEmpty message="加载中…" />
          ) : items.length === 0 ? (
            <AdminEmpty message="暂无用户" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">用户</th>
                    <th className="px-4 py-3 font-medium">角色</th>
                    <th className="px-4 py-3 font-medium">VIP</th>
                    <th className="px-4 py-3 font-medium">写作</th>
                    <th className="px-4 py-3 font-medium">状态</th>
                    <th className="px-4 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((user) => (
                    <tr key={user.id} className="border-b border-neutral-100 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-900">{user.nickname}</p>
                        <p className="text-xs text-neutral-400">{user.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-600">
                        {user.roles?.map((r) => r.name).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{user.vipLevel}</td>
                      <td className="px-4 py-3 text-neutral-700">{user.totalWritings}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            user.isBanned
                              ? 'bg-red-50 text-red-600'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {user.isBanned ? '已封禁' : '正常'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {canDetail && (
                            <AdminGhostButton
                              disabled={detailLoading}
                              onClick={() => void openDetail(user.id)}
                            >
                              详情
                            </AdminGhostButton>
                          )}
                          {canAssignRoles && (
                            <AdminGhostButton onClick={() => openRoles(user)}>角色</AdminGhostButton>
                          )}
                          {canVip && (
                            <AdminGhostButton
                              disabled={busyId === user.id}
                              onClick={() => void handleVip(user)}
                            >
                              VIP
                            </AdminGhostButton>
                          )}
                          {canBan && (
                            <AdminGhostButton
                              disabled={busyId === user.id}
                              onClick={() => void handleBanToggle(user)}
                            >
                              {user.isBanned ? '解封' : '封禁'}
                            </AdminGhostButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>

        <div className="mt-4 flex items-center justify-between text-xs text-neutral-400">
          <span>
            第 {page} / {totalPages} 页
          </span>
          <div className="flex gap-2">
            <AdminGhostButton disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              上一页
            </AdminGhostButton>
            <AdminGhostButton disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              下一页
            </AdminGhostButton>
          </div>
        </div>
      </AdminPageBody>

      <AdminModal
        open={Boolean(detail)}
        title="用户详情"
        onClose={() => setDetail(null)}
        footer={<AdminGhostButton onClick={() => setDetail(null)}>关闭</AdminGhostButton>}
      >
        {detail ? (
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-neutral-900">
                {detail.profile.nickname} · {detail.profile.email}
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                VIP {detail.profile.vipLevel}
                {detail.profile.isBanned ? ' · 已封禁' : ''}
                {detail.profile.locationText ? ` · ${detail.profile.locationText}` : ''}
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                角色：{detail.profile.roles?.map((r) => r.name).join(', ') || '—'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-neutral-50 p-3">
                <p className="text-xs text-neutral-400">提交数</p>
                <p className="mt-1 font-semibold text-neutral-900">
                  {detail.writingStats.totalSubmits}
                </p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-3">
                <p className="text-xs text-neutral-400">平均分</p>
                <p className="mt-1 font-semibold text-neutral-900">
                  {detail.writingStats.averageScore.toFixed(1)}
                </p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-3">
                <p className="text-xs text-neutral-400">总字数</p>
                <p className="mt-1 font-semibold text-neutral-900">
                  {detail.writingStats.totalWords}
                </p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-3">
                <p className="text-xs text-neutral-400">最高分</p>
                <p className="mt-1 font-semibold text-neutral-900">
                  {detail.writingStats.highestScore}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">近期提交</p>
              <ul className="mt-2 space-y-2">
                {detail.recentSubmits.slice(0, 5).map((s) => (
                  <li key={s.id} className="rounded-lg border border-neutral-100 px-3 py-2 text-xs">
                    {s.title} · {s.topicType} · {s.aiScore ?? '—'} 分
                  </li>
                ))}
                {detail.recentSubmits.length === 0 ? (
                  <li className="text-xs text-neutral-400">暂无提交</li>
                ) : null}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">登录日志</p>
              <ul className="mt-2 space-y-2">
                {detail.loginLogs.slice(0, 5).map((log, index) => (
                  <li key={`${log.loginAt}-${index}`} className="text-xs text-neutral-500">
                    {new Date(log.loginAt).toLocaleString('zh-CN')} · {log.ipAddress}
                  </li>
                ))}
                {detail.loginLogs.length === 0 ? (
                  <li className="text-xs text-neutral-400">暂无登录记录</li>
                ) : null}
              </ul>
            </div>
          </div>
        ) : null}
      </AdminModal>

      <AdminModal
        open={Boolean(roleUser)}
        title={`分配角色 · ${roleUser?.nickname ?? ''}`}
        onClose={() => setRoleUser(null)}
        footer={
          <>
            <AdminGhostButton onClick={() => setRoleUser(null)}>取消</AdminGhostButton>
            <AdminPrimaryButton disabled={savingRoles} onClick={() => void saveRoles()}>
              {savingRoles ? '保存中…' : '保存'}
            </AdminPrimaryButton>
          </>
        }
      >
        <AdminField label="选择角色">
          <div className="space-y-2">
            {roles.map((role) => {
              const checked = selectedRoleIds.includes(role.id)
              return (
                <label
                  key={role.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-100 px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelectedRoleIds((prev) =>
                        checked ? prev.filter((id) => id !== role.id) : [...prev, role.id],
                      )
                    }
                  />
                  <span className="font-medium text-neutral-800">{role.name}</span>
                  <span className="text-xs text-neutral-400">{role.description}</span>
                </label>
              )
            })}
          </div>
        </AdminField>
      </AdminModal>
    </div>
  )
}
