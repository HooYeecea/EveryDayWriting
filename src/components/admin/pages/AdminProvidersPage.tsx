import { useCallback, useEffect, useState } from 'react'
import {
  deleteAdminModel,
  deleteAdminProvider,
  getAdminProvider,
  listAdminProviders,
  toggleAdminModel,
  toggleAdminProvider,
  upsertAdminModel,
  upsertAdminProvider,
  type AdminProviderDetail,
  type AdminProviderItem,
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

const DEFAULT_TEMPLATE = { messages: [{ role: 'user', content: '{{prompt}}' }] }
const DEFAULT_MAPPING = { content: 'choices.0.message.content' }

export function AdminProvidersPage() {
  const { confirm } = useAppConfirm()
  const [items, setItems] = useState<AdminProviderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const [detail, setDetail] = useState<AdminProviderDetail | null>(null)
  const [providerFormOpen, setProviderFormOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState(false)
  const [providerId, setProviderId] = useState('')
  const [providerName, setProviderName] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [authHeader, setAuthHeader] = useState('Authorization')
  const [sortOrder, setSortOrder] = useState('99')
  const [savingProvider, setSavingProvider] = useState(false)

  const [modelFormOpen, setModelFormOpen] = useState(false)
  const [modelId, setModelId] = useState('')
  const [modelName, setModelName] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [maxTokens, setMaxTokens] = useState('4096')
  const [capabilities, setCapabilities] = useState('grammar,evaluation')
  const [savingModel, setSavingModel] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listAdminProviders()
      setItems(data.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载供应商失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const refreshDetail = async (id: string) => {
    setDetail(await getAdminProvider(id))
  }

  const openCreateProvider = () => {
    setEditingProvider(false)
    setProviderId('')
    setProviderName('')
    setBaseUrl('')
    setAuthHeader('Authorization')
    setSortOrder('99')
    setProviderFormOpen(true)
  }

  const openEditProvider = async (item: AdminProviderItem) => {
    setBusyId(item.id)
    try {
      const data = await getAdminProvider(item.id)
      setDetail(data)
      setEditingProvider(true)
      setProviderId(data.id)
      setProviderName(data.name)
      setBaseUrl(data.baseUrl)
      setAuthHeader(data.authHeader || 'Authorization')
      setSortOrder(String(data.sortOrder))
      setProviderFormOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载详情失败')
    } finally {
      setBusyId(null)
    }
  }

  const saveProvider = async () => {
    if (!providerId.trim() || !providerName.trim() || !baseUrl.trim()) {
      setError('Provider ID / 名称 / BaseUrl 不能为空')
      return
    }
    setSavingProvider(true)
    setError('')
    try {
      await upsertAdminProvider({
        id: providerId.trim(),
        name: providerName.trim(),
        baseUrl: baseUrl.trim(),
        authHeader: authHeader.trim() || 'Authorization',
        sortOrder: Number(sortOrder) || 99,
      })
      setProviderFormOpen(false)
      await load()
      if (detail?.id === providerId.trim()) {
        await refreshDetail(providerId.trim())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSavingProvider(false)
    }
  }

  const handleToggle = async (item: AdminProviderItem) => {
    setBusyId(item.id)
    try {
      await toggleAdminProvider(item.id, !item.isEnabled)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (item: AdminProviderItem) => {
    const ok = await confirm({
      title: '删除供应商',
      message: `确定删除供应商「${item.name}」？请先禁用或删除其下所有模型。`,
      confirmLabel: '删除',
      variant: 'warning',
    })
    if (!ok) return
    setBusyId(item.id)
    try {
      await deleteAdminProvider(item.id)
      if (detail?.id === item.id) setDetail(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    } finally {
      setBusyId(null)
    }
  }

  const openModels = async (item: AdminProviderItem) => {
    setBusyId(item.id)
    try {
      await refreshDetail(item.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载模型失败')
    } finally {
      setBusyId(null)
    }
  }

  const openCreateModel = () => {
    setModelId('')
    setModelName('')
    setIsDefault(false)
    setMaxTokens('4096')
    setCapabilities('grammar,evaluation')
    setModelFormOpen(true)
  }

  const saveModel = async () => {
    if (!detail) return
    if (!modelId.trim() || !modelName.trim()) {
      setError('模型 ID / 名称不能为空')
      return
    }
    setSavingModel(true)
    setError('')
    try {
      await upsertAdminModel(detail.id, {
        id: modelId.trim(),
        name: modelName.trim(),
        isDefault,
        maxTokens: Number(maxTokens) || 4096,
        capabilities: capabilities
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        requestTemplate: DEFAULT_TEMPLATE,
        responseMapping: DEFAULT_MAPPING,
      })
      setModelFormOpen(false)
      await refreshDetail(detail.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存模型失败')
    } finally {
      setSavingModel(false)
    }
  }

  const toggleModel = async (modelIdValue: string, enabled: boolean) => {
    if (!detail) return
    try {
      await toggleAdminModel(detail.id, modelIdValue, !enabled)
      await refreshDetail(detail.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '切换模型状态失败')
    }
  }

  const removeModel = async (modelIdValue: string) => {
    if (!detail) return
    const ok = await confirm({
      title: '删除模型',
      message: '确定删除该模型？此操作不可恢复。',
      confirmLabel: '删除',
      variant: 'warning',
    })
    if (!ok) return
    try {
      await deleteAdminModel(detail.id, modelIdValue)
      await refreshDetail(detail.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除模型失败')
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader
        title="模型供应商"
        description="Provider / Model 全量管理"
        actions={<AdminPrimaryButton onClick={openCreateProvider}>新增 Provider</AdminPrimaryButton>}
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
              <AdminEmpty message="暂无供应商" />
            ) : (
              <ul className="divide-y divide-neutral-100">
                {items.map((item) => (
                  <li key={item.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-900">{item.name}</p>
                        <p className="mt-1 truncate text-xs text-neutral-400">
                          {item.id} · {item.baseUrl} · {item.modelCount} 模型
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          item.isEnabled
                            ? 'bg-neutral-900 text-white'
                            : 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        {item.isEnabled ? '启用' : '停用'}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <AdminGhostButton
                        disabled={busyId === item.id}
                        onClick={() => void openModels(item)}
                      >
                        模型
                      </AdminGhostButton>
                      <AdminGhostButton
                        disabled={busyId === item.id}
                        onClick={() => void openEditProvider(item)}
                      >
                        编辑
                      </AdminGhostButton>
                      <AdminGhostButton
                        disabled={busyId === item.id}
                        onClick={() => void handleToggle(item)}
                      >
                        {item.isEnabled ? '停用' : '启用'}
                      </AdminGhostButton>
                      <AdminGhostButton
                        disabled={busyId === item.id}
                        onClick={() => void handleDelete(item)}
                      >
                        删除
                      </AdminGhostButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          <AdminCard>
            {!detail ? (
              <AdminEmpty message="选择左侧供应商查看模型" />
            ) : (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-900">{detail.name} 模型</h3>
                    <p className="mt-1 text-xs text-neutral-400">{detail.id}</p>
                  </div>
                  <AdminPrimaryButton onClick={openCreateModel}>添加模型</AdminPrimaryButton>
                </div>
                <ul className="mt-4 space-y-3">
                  {detail.models.map((model) => (
                    <li
                      key={model.id}
                      className="rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-neutral-900">
                            {model.name}
                            {model.isDefault ? (
                              <span className="ml-2 rounded-full bg-neutral-900 px-1.5 py-0.5 text-[10px] text-white">
                                默认
                              </span>
                            ) : null}
                          </p>
                          <p className="mt-1 text-xs text-neutral-400">
                            {model.id} · max {model.maxTokens} ·{' '}
                            {model.isEnabled ? '启用' : '停用'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <AdminGhostButton
                            onClick={() => void toggleModel(model.id, model.isEnabled)}
                          >
                            {model.isEnabled ? '停用' : '启用'}
                          </AdminGhostButton>
                          <AdminGhostButton onClick={() => void removeModel(model.id)}>
                            删除
                          </AdminGhostButton>
                        </div>
                      </div>
                    </li>
                  ))}
                  {detail.models.length === 0 ? (
                    <li className="text-sm text-neutral-400">暂无模型</li>
                  ) : null}
                </ul>
              </div>
            )}
          </AdminCard>
        </div>
      </AdminPageBody>

      <AdminModal
        open={providerFormOpen}
        title={editingProvider ? '编辑 Provider' : '新增 Provider'}
        onClose={() => setProviderFormOpen(false)}
        footer={
          <>
            <AdminGhostButton onClick={() => setProviderFormOpen(false)}>取消</AdminGhostButton>
            <AdminPrimaryButton disabled={savingProvider} onClick={() => void saveProvider()}>
              {savingProvider ? '保存中…' : '保存'}
            </AdminPrimaryButton>
          </>
        }
      >
        <div className="space-y-3">
          <AdminField label="ID">
            <input
              className={adminInputClass}
              value={providerId}
              disabled={editingProvider}
              onChange={(e) => setProviderId(e.target.value)}
              placeholder="如 deepseek"
            />
          </AdminField>
          <AdminField label="名称">
            <input
              className={adminInputClass}
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
            />
          </AdminField>
          <AdminField label="Base URL">
            <input
              className={adminInputClass}
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </AdminField>
          <AdminField label="Auth Header">
            <input
              className={adminInputClass}
              value={authHeader}
              onChange={(e) => setAuthHeader(e.target.value)}
            />
          </AdminField>
          <AdminField label="排序">
            <input
              className={adminInputClass}
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </AdminField>
        </div>
      </AdminModal>

      <AdminModal
        open={modelFormOpen}
        title="添加 / 更新模型"
        onClose={() => setModelFormOpen(false)}
        footer={
          <>
            <AdminGhostButton onClick={() => setModelFormOpen(false)}>取消</AdminGhostButton>
            <AdminPrimaryButton disabled={savingModel} onClick={() => void saveModel()}>
              {savingModel ? '保存中…' : '保存'}
            </AdminPrimaryButton>
          </>
        }
      >
        <div className="space-y-3">
          <AdminField label="模型 ID">
            <input
              className={adminInputClass}
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              placeholder="如 deepseek-v3"
            />
          </AdminField>
          <AdminField label="名称">
            <input
              className={adminInputClass}
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
            />
          </AdminField>
          <AdminField label="Max Tokens">
            <input
              className={adminInputClass}
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
            />
          </AdminField>
          <AdminField label="Capabilities（逗号分隔）">
            <input
              className={adminInputClass}
              value={capabilities}
              onChange={(e) => setCapabilities(e.target.value)}
            />
          </AdminField>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            设为该供应商默认模型
          </label>
        </div>
      </AdminModal>
    </div>
  )
}
