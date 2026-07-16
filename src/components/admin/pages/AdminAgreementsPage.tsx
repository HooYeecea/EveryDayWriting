import { useCallback, useEffect, useState } from 'react'
import {
  createAdminAgreement,
  deleteAdminAgreement,
  listAdminAgreements,
  updateAdminAgreement,
  type AdminAgreementListItem,
} from '../../../api/admin'
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
import { useReportReady } from '../../../hooks/useReportReady'

function isEffective(item: AdminAgreementListItem): boolean {
  return new Date(item.effectiveAt).getTime() <= Date.now()
}

export function AdminAgreementsPage({ onReady }: { onReady?: () => void } = {}) {
  const { confirm } = useAppConfirm()
  const [items, setItems] = useState<AdminAgreementListItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [type, setType] = useState('privacy')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [effectiveAt, setEffectiveAt] = useState('')
  const [saving, setSaving] = useState(false)

  const [editItem, setEditItem] = useState<AdminAgreementListItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editEffectiveAt, setEditEffectiveAt] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listAdminAgreements({ page, pageSize: 20 })
      setItems(data.items)
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载协议失败')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void load()
  }, [load])

  useReportReady(!loading, onReady)

  const handleCreate = async () => {
    if (!title.trim() || !content.trim() || !effectiveAt) {
      setError('类型、标题、内容与生效时间均必填')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createAdminAgreement({
        type: type.trim(),
        title: title.trim(),
        content: content.trim(),
        effectiveAt: new Date(effectiveAt).toISOString(),
      })
      setCreateOpen(false)
      setTitle('')
      setContent('')
      setEffectiveAt('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布失败')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (item: AdminAgreementListItem) => {
    if (isEffective(item)) {
      setError('已生效的协议不可修改，请创建新版本')
      return
    }
    setEditItem(item)
    setEditTitle(item.title)
    setEditContent('')
    setEditEffectiveAt(item.effectiveAt.slice(0, 16))
  }

  const handleUpdate = async () => {
    if (!editItem) return
    setSavingEdit(true)
    setError('')
    try {
      await updateAdminAgreement(editItem.id, {
        title: editTitle.trim() || undefined,
        content: editContent.trim() || undefined,
        effectiveAt: editEffectiveAt ? new Date(editEffectiveAt).toISOString() : undefined,
      })
      setEditItem(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async (item: AdminAgreementListItem) => {
    if (isEffective(item)) {
      setError('已生效的协议不可删除')
      return
    }
    const ok = await confirm({
      title: '删除协议',
      message: '确定删除该未生效协议？此操作不可恢复。',
      confirmLabel: '删除',
      variant: 'warning',
    })
    if (!ok) return
    try {
      await deleteAdminAgreement(item.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader
        title="协议管理"
        description="用户协议 / 隐私政策版本管理（已生效不可改删）"
        actions={<AdminPrimaryButton onClick={() => setCreateOpen(true)}>发布新版本</AdminPrimaryButton>}
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
            <AdminEmpty message="暂无协议" />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {items.map((item) => {
                const effective = isEffective(item)
                return (
                  <li key={item.id} className="px-4 py-4 sm:px-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-neutral-900">{item.title}</p>
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">
                        {item.type}
                      </span>
                      <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[11px] text-white">
                        v{item.version}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] ${
                          effective
                            ? 'bg-neutral-100 text-neutral-600'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {effective ? '已生效' : '未生效'}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-neutral-400">
                      生效 {new Date(item.effectiveAt).toLocaleString('zh-CN')} · 接受{' '}
                      {item.acceptanceCount} · {item.publishedBy?.email}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <AdminGhostButton disabled={effective} onClick={() => openEdit(item)}>
                        编辑
                      </AdminGhostButton>
                      <AdminGhostButton
                        disabled={effective}
                        onClick={() => void handleDelete(item)}
                      >
                        删除
                      </AdminGhostButton>
                    </div>
                  </li>
                )
              })}
            </ul>
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
        open={createOpen}
        title="发布协议新版本"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <AdminGhostButton onClick={() => setCreateOpen(false)}>取消</AdminGhostButton>
            <AdminPrimaryButton disabled={saving} onClick={() => void handleCreate()}>
              {saving ? '发布中…' : '发布'}
            </AdminPrimaryButton>
          </>
        }
      >
        <div className="space-y-3">
          <AdminField label="类型">
            <select className={adminInputClass} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="privacy">privacy</option>
              <option value="terms">terms</option>
              <option value="user">user</option>
            </select>
          </AdminField>
          <AdminField label="标题">
            <input className={adminInputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </AdminField>
          <AdminField label="内容">
            <textarea
              className={adminInputClass}
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </AdminField>
          <AdminField label="生效时间">
            <input
              type="datetime-local"
              className={adminInputClass}
              value={effectiveAt}
              onChange={(e) => setEffectiveAt(e.target.value)}
            />
          </AdminField>
        </div>
      </AdminModal>

      <AdminModal
        open={Boolean(editItem)}
        title={`编辑协议 v${editItem?.version ?? ''}`}
        onClose={() => setEditItem(null)}
        footer={
          <>
            <AdminGhostButton onClick={() => setEditItem(null)}>取消</AdminGhostButton>
            <AdminPrimaryButton disabled={savingEdit} onClick={() => void handleUpdate()}>
              {savingEdit ? '保存中…' : '保存'}
            </AdminPrimaryButton>
          </>
        }
      >
        <div className="space-y-3">
          <AdminField label="标题">
            <input
              className={adminInputClass}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </AdminField>
          <AdminField label="内容（留空则不改）">
            <textarea
              className={adminInputClass}
              rows={6}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="列表接口不含正文，如需修改请重新填写"
            />
          </AdminField>
          <AdminField label="生效时间">
            <input
              type="datetime-local"
              className={adminInputClass}
              value={editEffectiveAt}
              onChange={(e) => setEditEffectiveAt(e.target.value)}
            />
          </AdminField>
        </div>
      </AdminModal>
    </div>
  )
}
