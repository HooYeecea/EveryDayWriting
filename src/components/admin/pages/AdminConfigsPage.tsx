import { useCallback, useEffect, useState } from 'react'
import { listAdminConfigs, updateAdminConfig, type AdminConfigItem } from '../../../api/admin'
import {
  AdminCard,
  AdminEmpty,
  AdminError,
  AdminPageBody,
  AdminPageHeader,
  AdminPrimaryButton,
} from '../AdminUi'

export function AdminConfigsPage() {
  const [items, setItems] = useState<AdminConfigItem[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listAdminConfigs()
      setItems(data.items)
      setDrafts(Object.fromEntries(data.items.map((item) => [item.key, item.value])))
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载配置失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader title="系统配置" description="动态开关与限额参数" />
      <AdminPageBody>
        {error ? <div className="mb-4"><AdminError message={error} /></div> : null}
        <AdminCard>
          {loading ? (
            <AdminEmpty message="加载中…" />
          ) : items.length === 0 ? (
            <AdminEmpty message="暂无配置" />
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
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
