import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getAdminFreeChannelConfig,
  listAdminConfigs,
  setAdminFreeChannelDefault,
  updateAdminConfig,
  type AdminConfigItem,
  type AdminFreeChannelProviderOption,
} from '../../../api/admin'
import { MenuSelect } from '../../common/MenuSelect'
import {
  AdminCard,
  AdminEmpty,
  AdminError,
  AdminField,
  AdminPageBody,
  AdminPageHeader,
  AdminPrimaryButton,
} from '../AdminUi'
import { useReportReady } from '../../../hooks/useReportReady'

const FREE_CHANNEL_MANAGED_KEYS = new Set([
  'free_enabled',
  'free_default_provider',
  'free_default_model',
])

function isFreeEnabled(value: string | undefined): boolean {
  return (value ?? '').trim().toLowerCase() === 'true'
}

export function AdminConfigsPage({ onReady }: { onReady?: () => void } = {}) {
  const [items, setItems] = useState<AdminConfigItem[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const [freeEnabled, setFreeEnabled] = useState(false)
  const [freeEnabledSaving, setFreeEnabledSaving] = useState(false)
  const [freeChannelLoading, setFreeChannelLoading] = useState(false)
  const [freeChannelProviders, setFreeChannelProviders] = useState<AdminFreeChannelProviderOption[]>(
    [],
  )
  const [draftProviderId, setDraftProviderId] = useState('')
  const [draftModelId, setDraftModelId] = useState('')
  const [savedProviderId, setSavedProviderId] = useState('')
  const [savedModelId, setSavedModelId] = useState('')
  const [savingFreeDefaults, setSavingFreeDefaults] = useState(false)

  const loadConfigs = useCallback(async () => {
    const data = await listAdminConfigs()
    setItems(data.items)
    setDrafts(Object.fromEntries(data.items.map((item) => [item.key, item.value])))
    const enabled = isFreeEnabled(data.items.find((item) => item.key === 'free_enabled')?.value)
    setFreeEnabled(enabled)
    return enabled
  }, [])

  const loadFreeChannel = useCallback(async () => {
    setFreeChannelLoading(true)
    try {
      const data = await getAdminFreeChannelConfig()
      setFreeChannelProviders(data.providers)
      const providerId = data.providerId ?? ''
      const modelId = data.modelId ?? ''
      setDraftProviderId(providerId)
      setDraftModelId(modelId)
      setSavedProviderId(providerId)
      setSavedModelId(modelId)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载免费通道配置失败')
    } finally {
      setFreeChannelLoading(false)
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const enabled = await loadConfigs()
      if (enabled) {
        await loadFreeChannel()
      } else {
        setFreeChannelProviders([])
        setDraftProviderId('')
        setDraftModelId('')
        setSavedProviderId('')
        setSavedModelId('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载配置失败')
    } finally {
      setLoading(false)
    }
  }, [loadConfigs, loadFreeChannel])

  useEffect(() => {
    void load()
  }, [load])

  useReportReady(!loading, onReady)

  const otherItems = useMemo(
    () => items.filter((item) => !FREE_CHANNEL_MANAGED_KEYS.has(item.key)),
    [items],
  )

  const selectedProvider = freeChannelProviders.find((p) => p.id === draftProviderId)
  const modelOptions = selectedProvider?.models ?? []

  const freeDefaultsDirty =
    draftProviderId !== savedProviderId || draftModelId !== savedModelId

  const save = async (key: string) => {
    setSavingKey(key)
    setError('')
    try {
      await updateAdminConfig(key, drafts[key] ?? '')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSavingKey(null)
    }
  }

  const toggleFreeEnabled = async () => {
    const next = !freeEnabled
    setFreeEnabledSaving(true)
    setError('')
    try {
      await updateAdminConfig('free_enabled', next ? 'true' : 'false')
      setFreeEnabled(next)
      setDrafts((prev) => ({ ...prev, free_enabled: next ? 'true' : 'false' }))
      if (next) {
        await loadFreeChannel()
      } else {
        setFreeChannelProviders([])
        setDraftProviderId('')
        setDraftModelId('')
        setSavedProviderId('')
        setSavedModelId('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setFreeEnabledSaving(false)
    }
  }

  const saveFreeDefaults = async () => {
    if (!draftProviderId) {
      setError('请选择默认免费厂商')
      return
    }
    setSavingFreeDefaults(true)
    setError('')
    try {
      await setAdminFreeChannelDefault({
        providerId: draftProviderId,
        modelId: draftModelId || undefined,
      })
      setSavedProviderId(draftProviderId)
      setSavedModelId(draftModelId)
      await loadConfigs()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存免费通道默认配置失败')
    } finally {
      setSavingFreeDefaults(false)
    }
  }

  const handleProviderChange = (providerId: string) => {
    setDraftProviderId(providerId)
    const provider = freeChannelProviders.find((p) => p.id === providerId)
    const defaultModel =
      provider?.models.find((m) => m.isDefault)?.id ?? provider?.models[0]?.id ?? ''
    setDraftModelId(defaultModel)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader title="系统配置" description="动态开关与限额参数" />
      <AdminPageBody>
        {error ? (
          <div className="mb-4">
            <AdminError message={error} />
          </div>
        ) : null}

        <AdminCard className="mb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900">服务端免费 AI 通道</p>
              <p className="mt-1 text-sm text-neutral-500">
                开启后，未配置自有 API Key 的用户将使用平台提供的 Key；可在「模型供应商」页为厂商配置服务端
                Key。
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={freeEnabled}
              aria-label="是否启用服务端免费 AI 通道"
              disabled={loading || freeEnabledSaving}
              onClick={() => void toggleFreeEnabled()}
              className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50 ${
                freeEnabled ? 'bg-neutral-900' : 'bg-neutral-200'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  freeEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {freeEnabled ? (
            <div className="mt-6 space-y-4 border-t border-neutral-100 pt-5">
              {freeChannelLoading ? (
                <p className="text-sm text-neutral-400">加载可选厂商…</p>
              ) : freeChannelProviders.length === 0 ? (
                <p className="text-sm text-amber-700">
                  暂无可用厂商。请先在「模型供应商」中为已启用的厂商填写服务端 API Key。
                </p>
              ) : (
                <>
                  <AdminField label="免费通道默认厂商">
                    <MenuSelect
                      value={draftProviderId}
                      options={freeChannelProviders.map((p) => ({
                        value: p.id,
                        label: p.name,
                      }))}
                      onChange={handleProviderChange}
                      placeholder="选择厂商"
                      ariaLabel="免费通道默认厂商"
                      disabled={savingFreeDefaults}
                    />
                  </AdminField>
                  <AdminField label="免费通道默认模型">
                    <MenuSelect
                      value={draftModelId}
                      options={modelOptions.map((m) => ({
                        value: m.id,
                        label: m.isDefault ? `${m.name}（默认）` : m.name,
                      }))}
                      onChange={setDraftModelId}
                      placeholder={draftProviderId ? '选择模型（可选）' : '请先选择厂商'}
                      ariaLabel="免费通道默认模型"
                      disabled={!draftProviderId || modelOptions.length === 0 || savingFreeDefaults}
                    />
                    <p className="mt-1.5 text-xs text-neutral-400">
                      不选模型时，运行时将使用该厂商的默认启用模型。
                    </p>
                  </AdminField>
                  <div className="flex justify-end">
                    <AdminPrimaryButton
                      disabled={
                        savingFreeDefaults ||
                        !draftProviderId ||
                        !freeDefaultsDirty
                      }
                      onClick={() => void saveFreeDefaults()}
                    >
                      {savingFreeDefaults ? '保存中…' : '保存默认厂商/模型'}
                    </AdminPrimaryButton>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </AdminCard>

        <AdminCard>
          {loading ? (
            <AdminEmpty message="加载中…" />
          ) : otherItems.length === 0 ? (
            <AdminEmpty message="暂无其他配置" />
          ) : (
            <ul className="space-y-4">
              {otherItems.map((item) => (
                <li key={item.key} className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-neutral-500">{item.key}</p>
                      <p className="mt-1 text-sm text-neutral-700">{item.description || '—'}</p>
                      <input
                        value={drafts[item.key] ?? ''}
                        onChange={(e) =>
                          setDrafts((prev) => ({ ...prev, [item.key]: e.target.value }))
                        }
                        className="mt-3 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"
                      />
                    </div>
                    <AdminPrimaryButton
                      disabled={savingKey === item.key || drafts[item.key] === item.value}
                      onClick={() => void save(item.key)}
                    >
                      {savingKey === item.key ? '保存中…' : '保存'}
                    </AdminPrimaryButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </AdminPageBody>
    </div>
  )
}
