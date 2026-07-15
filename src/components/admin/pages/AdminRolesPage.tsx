import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createAdminRole,
  deleteAdminRole,
  getAdminRole,
  listAdminPermissions,
  listAdminRoles,
  updateAdminRole,
  type AdminPermissionItem,
  type AdminRoleDetail,
  type AdminRoleItem,
} from '../../../api/admin'
import { useAuth } from '../../../context/AuthContext'
import { useAppConfirm } from '../../../context/AppConfirmContext'
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
  adminInputClass,
} from '../AdminUi'
import { AdminActionMenu } from '../AdminActionMenu'

export function AdminRolesPage() {
  const { refreshAccess } = useAuth()
  const { confirm } = useAppConfirm()
  const [items, setItems] = useState<AdminRoleItem[]>([])
  const [permissions, setPermissions] = useState<AdminPermissionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [createPermissionIds, setCreatePermissionIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const [detail, setDetail] = useState<AdminRoleDetail | null>(null)
  const [editPermissionIds, setEditPermissionIds] = useState<string[]>([])
  const [editDescription, setEditDescription] = useState('')
  const [savingDetail, setSavingDetail] = useState(false)

  const groupedPermissions = useMemo(() => {
    const map = new Map<string, AdminPermissionItem[]>()
    for (const p of permissions) {
      const list = map.get(p.group) ?? []
      list.push(p)
      map.set(p.group, list)
    }
    return Array.from(map.entries())
  }, [permissions])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [roles, perms] = await Promise.all([listAdminRoles(), listAdminPermissions()])
      setItems(roles.items)
      setPermissions(perms.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载角色失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openDetail = async (roleId: string) => {
    setError('')
    try {
      const data = await getAdminRole(roleId)
      setDetail(data)
      setEditDescription(data.description ?? '')
      setEditPermissionIds(data.permissions.map((p) => p.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载角色详情失败')
    }
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('角色名不能为空')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createAdminRole({
        name: name.trim(),
        description: description.trim() || undefined,
        permissionIds: createPermissionIds,
      })
      setCreateOpen(false)
      setName('')
      setDescription('')
      setCreatePermissionIds([])
      await load()
      await refreshAccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!detail) return
    setSavingDetail(true)
    setError('')
    try {
      await updateAdminRole(detail.id, {
        description: editDescription,
        permissionIds: editPermissionIds,
      })
      await openDetail(detail.id)
      await load()
      await refreshAccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败')
    } finally {
      setSavingDetail(false)
    }
  }

  const handleDelete = async (item: AdminRoleItem) => {
    if (item.isSystem) {
      setError('系统内置角色不可删除')
      return
    }
    const ok = await confirm({
      title: '删除角色',
      message: `确定删除角色「${item.name}」？此操作不可恢复。`,
      confirmLabel: '删除',
      variant: 'warning',
    })
    if (!ok) return
    try {
      await deleteAdminRole(item.id)
      if (detail?.id === item.id) setDetail(null)
      await load()
      await refreshAccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    }
  }

  const renderPermissionChecklist = (
    selected: string[],
    onChange: (ids: string[]) => void,
  ) => (
    <div className="max-h-64 space-y-3 overflow-y-auto rounded-xl border border-neutral-100 p-3">
      {groupedPermissions.map(([group, list]) => (
        <div key={group}>
          <p className="mb-2 text-xs font-medium text-neutral-500">{group}</p>
          <div className="space-y-1.5">
            {list.map((p) => {
              const checked = selected.includes(p.id)
              return (
                <label key={p.id} className="flex items-center gap-2 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onChange(
                        checked ? selected.filter((id) => id !== p.id) : [...selected, p.id],
                      )
                    }
                  />
                  <span>
                    {p.name}
                    <span className="ml-1 font-mono text-[11px] text-neutral-400">{p.code}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader
        title="角色权限"
        description="角色 CRUD 与权限绑定"
        actions={<AdminPrimaryButton onClick={() => setCreateOpen(true)}>新建角色</AdminPrimaryButton>}
      />
      <AdminPageBody>
        {error ? (
          <div className="mb-4">
            <AdminError message={error} />
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-2">
          <AdminCard className="overflow-hidden p-0 sm:p-0">
            {loading ? (
              <AdminEmpty message="加载中…" />
            ) : items.length === 0 ? (
              <AdminEmpty message="暂无角色" />
            ) : (
              <ul className="divide-y divide-neutral-100">
                {items.map((item) => (
                  <li key={item.id} className="px-4 py-4 sm:px-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-neutral-900">{item.name}</p>
                      {item.isSystem && (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">
                          系统
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">{item.description || '—'}</p>
                    <p className="mt-2 text-xs text-neutral-400">
                      {item.userCount} 用户 · {item.permissionCount} 权限
                    </p>
                    <div className="mt-3">
                      <AdminActionMenu
                        items={[
                          {
                            id: 'edit',
                            label: '详情/编辑',
                            onClick: () => void openDetail(item.id),
                          },
                          {
                            id: 'delete',
                            label: '删除',
                            disabled: item.isSystem,
                            tone: 'danger',
                            onClick: () => void handleDelete(item),
                          },
                        ]}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          <AdminCard>
            {!detail ? (
              <AdminEmpty message="选择左侧角色查看权限" />
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-neutral-900">{detail.name}</h3>
                  <p className="mt-1 text-xs text-neutral-400">
                    {detail.isSystem ? '系统角色' : '自定义角色'}
                  </p>
                </div>
                <AdminField label="描述">
                  <input
                    className={adminInputClass}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </AdminField>
                <AdminField label="权限">
                  {renderPermissionChecklist(editPermissionIds, setEditPermissionIds)}
                </AdminField>
                <AdminPrimaryButton disabled={savingDetail} onClick={() => void handleUpdate()}>
                  {savingDetail ? '保存中…' : '保存权限'}
                </AdminPrimaryButton>
              </div>
            )}
          </AdminCard>
        </div>
      </AdminPageBody>

      <AdminModal
        open={createOpen}
        title="新建角色"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <AdminGhostButton onClick={() => setCreateOpen(false)}>取消</AdminGhostButton>
            <AdminPrimaryButton disabled={saving} onClick={() => void handleCreate()}>
              {saving ? '创建中…' : '创建'}
            </AdminPrimaryButton>
          </>
        }
      >
        <div className="space-y-3">
          <AdminField label="名称">
            <input className={adminInputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </AdminField>
          <AdminField label="描述">
            <input
              className={adminInputClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </AdminField>
          <AdminField label="权限">
            {renderPermissionChecklist(createPermissionIds, setCreatePermissionIds)}
          </AdminField>
        </div>
      </AdminModal>
    </div>
  )
}
